#!/usr/bin/env python3
"""Normalize pinned game exports and reviewed supplemental datasets into the static app."""
import argparse
import collections
import html
import json
import re
import subprocess
from datetime import datetime, timedelta, timezone
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor

root = Path(__file__).resolve().parents[2]
out = root / 'src/database/data'
agent_data = out / 'kits'
revision = 'ab85fff9659168f981904259ebb9ec2c51fb5fe4'
enka_revision = 'a9b583eb4a708dd3db56f6bdef35c3e84e4d213c'
meta_revision = 'b4589c02c11e32d8b0de33de9b933037cf5c33c9'
versions_revision = '7f92f0296c95f34d31b841cd078511d17f532744'
checked = '2026-11-18'
version = '3.3'
release_limit = tuple(map(int, version.split('.')))
cycle = '3.3.2'
release_notice = 'https://zenless.hoyoverse.com/en-us/news/166963'
banner_archive = 'https://bannerhistory.app/en/zzz-pickup-history'
tables = '''AvatarBase AvatarBattle AvatarUI AvatarPassiveSkill AvatarPassiveSkillDes AvatarSkillDes
AvatarSkillLevel AvatarSkill AvatarTalent AvatarSpecialAwakenDes AvatarSkillReco AvatarLevelAdvance AvatarProfession
BuddyBase BuddyUI BuddySkillLevelUp BuddyLevelAdvance BuddySkill EquipmentSuit EquipmentLevel EquipmentPropertyFilter
Weapon WeaponLevel WeaponStar Item GachaItemResource CampConst AccessConfig DamageElementConfig'''.split()
cfg = f'https://git.mero.moe/dimbreath/ZenlessData/raw/commit/{revision}'
enka = f'https://raw.githubusercontent.com/EnkaNetwork/API-docs/{enka_revision}/store/zzz'
meta = f'https://huggingface.co/datasets/LvlUrArti/ShiyuDataProcessed/resolve/{meta_revision}/{cycle}'

source_files = {name + 'TemplateTb.json': f'{cfg}/FileCfg/{name}TemplateTb.json?download=1' for name in tables}
source_files.update({name: f'{enka}/{name}.json' for name in ['avatars', 'weapons', 'equipments', 'locs', 'property']})
source_files.update({
    'raw-en': f'{cfg}/TextMap/TextMap_ENTemplateTb.json', 'raw-en-over': f'{cfg}/TextMap/TextMap_ENOverwriteTemplateTb.json',
    'zutils': f'https://raw.githubusercontent.com/njxaxson/zzz-utils/{versions_revision}/app/public/data/units.json',
    'banner-pickup': banner_archive, 'meta-builds': f'{meta}/builds.json',
    'meta-da': f'{meta}/da/comps/top_combined.json', 'meta-sd': f'{meta}/sd/comps/top_combined.json',
})

ranks = {2: 'B', 3: 'A', 4: 'S'}
attributes = {200: 'Physical', 201: 'Fire', 202: 'Ice', 203: 'Electric', 204: 'Wind', 205: 'Ether', 300: 'Lumiflux'}
element_labels = {'Physics': 'Physical', 'Elec': 'Electric', 'Lumen': 'Lumiflux', 'FireFrost': 'Frost', 'AuricEther': 'Auric Ink', 'ZhenZhenAssault': 'Honed Edge'}
attack_types = {101:'Slash',102:'Strike',103:'Pierce'}
groups = {0: 'Basic Attack', 1: 'Special Attack', 2: 'Dodge', 3: 'Chain Attack', 5: 'Core Skill', 6: 'Assist'}
disc_versions = {31800:'1.2',31900:'1.2',32700:'1.4',32800:'1.4',32900:'1.6',33000:'1.6',33100:'2.0',33200:'2.0',
    33300:'2.2',33400:'2.2',33500:'2.5',33600:'2.5',33700:'2.6',33800:'2.7',
    33900:'3.0',34000:'3.0',34100:'3.1',34200:'3.1'}
agent_aliases = {1011:['Anby Demara'], 1021:['Nekomiya Mana'], 1081:['Billy Kid'], 1141:['Von Lycaon'], 1151:['Luciana de Montefio'],
    1201:['Asaba Harumasa'], 1211:['Alexandrina Sebastiane'], 1261:['Jane Doe'], 1301:['Orphie', 'Magus', 'Orphie Magnusson'],
    1381:['Soldier 0 Anby', 'Soldier 0-Anby', 'SAnby'], 1441:['Komano Manato'], 1491:['Sunna'], 1511:['Nangong Yu'],
    1531:['Starlight Billy', 'Starlight Billy Kid'], 1581:['Remielle Dan'], 1631:['Severian Lowell'], 1641:['Phoenix Reffaella']}
factions_short = {5:'Defense Force',7:'New Eridu Public Security',16:'Roscaelifer'}
event_boos = {53002,53003,53013,53014,53015,53016,53017,53019,53021}

def load(path):
    return json.loads(path.read_text(encoding='utf-8-sig'))

def write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')

def fetch(url, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(path.suffix + '.download')
    try:
        subprocess.run(['curl','-fsSL','--retry','1','--max-time','40',url,'-o',str(temp)], check=True)
        temp.replace(path)
    finally:
        temp.unlink(missing_ok=True)

def clean(value):
    icons = {'Normal':'Basic Attack','Special':'Special Attack','SpecialReady':'EX Special Attack','Evade':'Dodge','UltimateReady':'Ultimate','Switch':'Assist',
             'SwitchLeft':'switch to the previous Agent','SwitchRight':'switch to the next Agent'}
    value = re.sub(r'<IconMap:Icon_([^>]+)>', lambda m: '[' + icons.get(m[1], m[1].replace('_',' ')) + ']', value or '')
    value = re.sub(r'<br\s*/?>', '\n', value, flags=re.I)
    return html.unescape(re.sub(r'<[^>]+>', '', value)).replace('\\n','\n').replace('\xa0',' ').strip()

def key(text):
    return re.sub(r'[^a-z0-9]+', '', text.lower())

def grouped(values, name):
    result = collections.defaultdict(list)
    for row in values:
        result[row[name]].append(row)
    return result

def indexed(values, name):
    return {row[name]: row for row in values}

def assets_url(name):
    return 'https://static.nanoka.cc/assets/zzz/' + name + '.webp'

def import_data(cache, download_art):
    with ThreadPoolExecutor(max_workers=8) as pool:
        def get(item):
            name, url = item
            path = cache / name
            if not path.is_file(): fetch(url, path)
        list(pool.map(get, source_files.items()))
    table = {n: next(iter(load(cache / f'{n}TemplateTb.json').values())) for n in tables}
    loc = load(cache/'raw-en') | load(cache/'raw-en-over')
    enka_avatars, enka_engines = load(cache/'avatars'), load(cache/'weapons')
    enka_en = load(cache/'locs')['en']
    text = lambda k: clean(loc.get(k) or enka_en.get(k))
    art = {}
    item_rows = indexed(table['Item'], 'PFOAJKNPCHL')
    access_rows = indexed(table['AccessConfig'], 'FINCEBHBJHG')
    def acquisition(item_ids):
        labels = []
        for identity in item_ids:
            acc = access_rows.get(item_rows.get(identity, {}).get('FINCEBHBJHG'), {})
            labels.extend(text(value).replace('[Obtain] ', '') for value in acc.values()
                          if isinstance(value, str) and value.startswith('TextMap_Access_') and text(value))
        return ' · '.join(dict.fromkeys(labels))
    agents, engines, discs, boo, materials = [], [], [], [], {}
    agent_raw = indexed(table['AvatarBase'], 'PFOAJKNPCHL')
    battle_raw = indexed(table['AvatarBattle'], 'PFOAJKNPCHL')
    ui_raw = indexed(table['AvatarUI'], 'PFOAJKNPCHL')
    camp_raw = {r['OOOHMBMDLBI']: text(r['LNGIOKPJAEO']) for r in table['CampConst']}
    roles = {r['NJGDHJBKNAJ']: text(r['AHPMICNNCFC']) for r in table['AvatarProfession']}
    availability = {key(alias): v['released'] for v in load(cache/'zutils') if re.fullmatch(r'\d+\.\d+', v.get('released','')) and tuple(map(int,v['released'].split('.'))) <= release_limit for alias in [v['id'],v['name']]}
    def item_cost(sources):
        counts = collections.Counter()
        for row in sources:
            item = row['HJOEBMMFOMB']
            name = text(item_rows.get(item, {}).get('HAKHHHCAENA', ''))
            if not name or not row['CPKDEBLNOMN']: continue
            ident = 'material-' + str(item)
            counts[ident] += row['CPKDEBLNOMN']
            materials[ident] = {'id': ident, 'name': name}
            if source := acquisition([item]): materials[ident]['acquisition'] = source
        return [{'id': item, 'count': count} for item,count in counts.items()]
    def image(ref, file, *urls):
        target = '/database-art/' + file + '.webp'
        art[target] = [url for url in urls if url]
        dest = root / 'public' / target.removeprefix('/')
        if download_art or dest.is_file(): ref['portrait' if file.endswith('-portrait') else 'image'] = target
    icons = {}
    def icon(name, kind, filename):
        if name and filename:
            entry = {}
            image(entry, 'icon-' + kind + '-' + key(name), assets_url(filename))
            if entry.get('image'): icons[name] = entry['image']
    for item in table['DamageElementConfig']:
        code = item['HAKHHHCAENA'].removeprefix('ElementType_')
        name = element_labels.get(code,code)
        if name != 'None': icon(name,'attribute',Path(item['ONLBKOPCCLB']).stem)
    for item in table['AvatarProfession']:
        icon(text(item['AHPMICNNCFC']),'specialty',Path(item['ONLBKOPCCLB']).stem)
    for item in table['CampConst']:
        source = item['LNGIOKPJAEO']
        icon(text(source),'faction','Icon' + source)
    core_desc = grouped(table['AvatarPassiveSkillDes'],'PBNPPFFJCGN')
    skill_desc = grouped(table['AvatarSkillDes'],'PBNPPFFJCGN')
    skill_stats = indexed(table['AvatarSkill'],'PFOAJKNPCHL')
    talents = grouped(table['AvatarTalent'],'PBNPPFFJCGN')
    potentials = grouped(table['AvatarSpecialAwakenDes'],'PFOAJKNPCHL')
    skill_costs = grouped(table['AvatarSkillLevel'],'PBNPPFFJCGN')
    core_costs = grouped(table['AvatarPassiveSkill'],'PBNPPFFJCGN')
    rank_costs = grouped(table['AvatarLevelAdvance'],'PBNPPFFJCGN')
    priorities = indexed(table['AvatarSkillReco'],'PBNPPFFJCGN')

    def numeric_row(a):
        label = text(a['KGLIAHOGMIO'])
        token = a['OKCGOIHCKPA']
        match = re.fullmatch(r'\{Skill:(\d+),\s*Prop:(100[12])\}', token)
        if not label or not match or int(match[1]) not in skill_stats: return None
        row = skill_stats[int(match[1])]
        base, growth = (row['BALHEIIFHLN'],row['KBEFIIEFCGH']) if match[2]=='1001' else (row['PLEPHHBDMGD'],row['BJCBBHKLCLB'])
        if not base and not growth: return None
        return {'name': label, 'levels': [f'{(base + growth*i)/100:g}%' for i in range(16)]}

    for raw_id, a in enka_avatars.items():
        i = int(raw_id)
        raw, battle = agent_raw[i], battle_raw[i]
        name = text(raw['HAKHHHCAENA'])
        fullname = text(raw['JGHFBBCBBBA'])
        aliases = sorted(set(agent_aliases.get(i, []) + [fullname]) - {name,''})
        agent = {'id':f'agent-{i}','name':name,'aliases':aliases,'rank':ranks[a['Rarity']],
                 'attribute':element_labels.get(a['ElementTypes'][0],a['ElementTypes'][0]),'specialty':a['ProfessionType'],
                 'faction':text(ui_raw[i]['LNGIOKPJAEO']) or camp_raw.get(raw['OOOHMBMDLBI'],'Unverified'),
                 'affiliations':list(dict.fromkeys(filter(None,[camp_raw.get(raw['OOOHMBMDLBI']),factions_short.get(raw['OOOHMBMDLBI'])]))),
                 'attackTypes':[attack_types[t] for t in battle['LCJEFOJHJLG'] if t in attack_types],
                 'baseAttribute':attributes.get(battle['CLPHMBAIKGI'][0],element_labels.get(a['ElementTypes'][0],a['ElementTypes'][0])),
                 'color':a.get('Colors',{}).get('Accent')}
        release_aliases = {1311:'astra',1381:'sanby',1441:'komano',1511:'nangong',1531:'sbilly',1411:'yuzuha'}
        release = next((availability[key(x)] for x in [release_aliases.get(i,''),name,*aliases] if key(x) in availability), None)
        if release: agent['version'] = release
        if str(a['WeaponId']) in enka_engines: agent['signatureId'] = f'engine-{a["WeaponId"]}'
        image(agent, f'agent-{i}', 'https://enka.network'+a['Image'], assets_url(Path(a['Image']).stem))
        image(agent, f'agent-{i}-portrait', 'https://enka.network'+a['CircleIcon'], assets_url(Path(a['CircleIcon']).stem))

        core = core_desc[i]
        skills = []
        seen = set()
        for s in skill_desc[i]:
            label, description = text(s['FLLDOEFBOMB']), text(s['KGLIAHOGMIO'])
            if s['FHNDNMJKPJL'] != 0 or not (label and description) or (label,description) in seen: continue
            seen.add((label,description))
            skills.append({'name':label,'description':description,'group':groups.get(s['NDGEGNEGKFF'],'Mechanics')})
        current = None
        for s in skill_desc[i]:
            if s['FHNDNMJKPJL'] != 1: continue
            if not s['OKCGOIHCKPA']:
                label = text(s['KGLIAHOGMIO'])
                current = next((row for row in skills if row['name'] == label),None)
            elif current and (number := numeric_row(s)):
                current.setdefault('numbers',[]).append(number)
        if core:
            keyed_core = {(label,j): [text(row['DLLEJMOICAE'][j]) if len(row['DLLEJMOICAE'])>j else '' for row in core[:7]]
                          for j,label in enumerate(core[0]['DJKBMAOKDFG'])}
            for (label,_), descriptions in keyed_core.items():
                descriptions = list(dict.fromkeys(v for v in descriptions if v))
                if descriptions and text(label):
                    entry = {'name':text(label),'description':descriptions[-1],'group':'Core Skill'}
                    if len(descriptions)>1:
                        entry['variants'] = [{'label':level,'text':value} for level,value in zip(['Base','A','B','C','D','E','F'],keyed_core[(label,_)]) if value]
                    skills.append(entry)
                    if 'Additional Ability' in text(label) or '_Math' in label:
                        agent['conditionText'] = descriptions[-1].split('\n')[0].rstrip(':')
        rules = []
        types = {'1':('faction',camp_raw,raw['OOOHMBMDLBI']), '2':('attribute',attributes,battle['CLPHMBAIKGI'][0]),
                 '3':('specialty',roles,next((k for k,v in roles.items() if v==agent['specialty']),None))}
        for rule in battle['JOIPHNNDKPA']:
            code,value,count = rule.split(':')
            if code not in types: continue
            kind,labels,own = types[code]; target = labels.get(int(value))
            if target: rules.append({'kind':kind,'values':[target],'count':max(1,int(count)-(int(value)==own))})
        # The raw conditional token for agent-specific matches is not decoded.
        if rules and all(r.split(':')[0] in types for r in battle['JOIPHNNDKPA']): agent['condition'] = rules
        mindscape = [{'name':text(row['ECOLPBLBHMK']), 'description':text(row['IEPODKDOOCN']), 'group':f"M{row['LIBGEDCAION']}"}
                     for row in talents[i] if text(row['IEPODKDOOCN']) and text(row['ECOLPBLBHMK'])]
        potential = [{'name':f"Potential {row['FPFFBIEHHBD']}",'description':text(row['JCFMFDCNKDC']),'group':'Potential'}
                     for row in potentials[i*100] if text(row['JCFMFDCNKDC'])]
        cost = {'Promotion':item_cost(c for row in rank_costs[i] if row['OOHLCKIMDOJ']<60 for c in row['GCABOLAIAIK']),
                'Core Skill':item_cost(c for row in core_costs[i] for c in row['BFONKKIEGFC'])}
        for group,n in groups.items():
            if group == 5: continue
            cost[n] = item_cost(c for row in skill_costs[i] if row['NDGEGNEGKFF']==group and row['EKNBGPHEFLJ']<12 for c in row['BPJAOGMIALI'])
        reco = priorities.get(i,{})
        priority = [' · '.join(groups.get(g, str(g)) for g in reco.get(t,[])) for t in ['GJPLEJDKOHG','JGJAMNMMCJI','GABOEEDOPNB']]
        kit = {'id':agent['id'],'base':a['BaseProps'],'growth':a['GrowthProps'],'promotions':a['PromotionProps'],
               'cores':a['CoreEnhancementProps'],'coreUnlocks':[1]+[row['HPFIDMADNGO'] for row in core_costs[i]],'skills':skills,'mindscapes':mindscape,'potential':potential,'materials':cost,'priority':priority}
        write_json(agent_data/f"{agent['id']}.json", kit)
        agents.append(agent)

    raw_weapons = indexed(table['Weapon'],'HJOEBMMFOMB')
    for n,w in enka_engines.items():
        i = int(n); name = text(w['ItemName']); raw = raw_weapons[i]
        signatures = [a for a in agents if a.get('signatureId') == f'engine-{n}']
        engine = {'id':f'engine-{n}','name': name,'rank':ranks[w['Rarity']],'specialty':w['ProfessionType'],
                  'signatureIds':[a['id'] for a in signatures],'base':w['MainStat']['PropertyValue'],
                  'secondary':{'stat':w['SecondaryStat']['PropertyId'],'value':w['SecondaryStat']['PropertyValue']},
                  'description':text(raw['KHDIKLCBGFA'].replace('_Desc','_ShortDesc')),
                  'materials':item_cost({'HJOEBMMFOMB':int(x.split(':')[0]),'CPKDEBLNOMN':int(x.split(':')[1])}
                                    for x in re.split('[|,]',raw['KKGKEDKLMEF']) if re.fullmatch(r'\d+:\d+',x))}
        title = text(f'Weapon_TalentTitle_{n}')
        if title: engine['effect'] = title
        for j in range(1,-1,-1):
            levels = [text(f'Weapon_TalentDes_8{n}{j}{k}') for k in range(1,6)]
            if all(levels) and not any('Test Engine Effect Description' in value for value in levels):
                engine['passiveLevels'] = levels
                break
        if source := acquisition([i]): engine['acquisition'] = source
        if name == 'Sol Exuvia':
            engine.update(version='3.0', acquisition='Free reward from Interboo progression after unlocking it in the Season 3 story.')
        image(engine,f'engine-{n}','https://enka.network'+w['ImagePath'], assets_url(Path(w['ImagePath']).stem))
        engines.append(engine)
    for r in table['EquipmentSuit']:
        i = r['PFOAJKNPCHL']
        disc = {'id':f'disc-{i}','name':text(r['HAKHHHCAENA']),'version':disc_versions.get(i,'1.0'),
                'two':text(r['FPHLEACPNFP']),'four':text(r['LAHGNBGJIOM']),
                'bonuses':[{'stat':v['IINHKLMBKBN'],'value':v['OKCGOIHCKPA']} for v in r['KJNEHKOICNF']]}
        if source := acquisition(r['JMJNDIPCEAL']): disc['acquisition'] = source
        if i in (33900,34000): disc['acquisition'] = 'Area Patrol · Pilot and the Rebel Mech'
        if i in (34100,34200): disc['acquisition'] = 'Area Patrol · Swiftspine and Splitclaw'
        filename = Path(r['AGOLKDELCBH']).stem
        image(disc,f'disc-{i}',f'https://enka.network/ui/zzz/{filename}.png',assets_url(filename))
        discs.append(disc)
    boo_assets = indexed(table['GachaItemResource'],'HJOEBMMFOMB')
    boo_ui = indexed(table['BuddyUI'],'PFOAJKNPCHL')
    boo_advance = grouped(table['BuddyLevelAdvance'],'APMMJLNHAMB')
    boo_skill = grouped(table['BuddySkillLevelUp'],'APMMJLNHAMB')
    for r in table['BuddyBase']:
        i = r['PFOAJKNPCHL']; name = text(r['HAKHHHCAENA'])
        if not name or i not in boo_ui or not (53000 <= i < 55000): continue
        abilities = []
        for code,group,expected in [(2,'Active Skill','ActiveSkill'),(3,'Additional Ability','TalentSkill'),(4,'Chain Attack','QTE')]:
            rows = [row for row in boo_skill[i] if row['NDGEGNEGKFF']==code and expected in row['DEOPFPBJLIH'] and text(row['CGFPDFGBIIF'])]
            if not rows: continue
            by_rank = {row['MLCMDJNCPPL']:text(row['CGFPDFGBIIF']) for row in rows if row['MLCMDJNCPPL']<=5}
            first = rows[0]
            skill = {'name':text(first['DEOPFPBJLIH']),'description':text(first['CGFPDFGBIIF']),'group':group}
            if len(set(by_rank.values()))>1:
                skill['variants'] = [{'label':str(rank)+' stars','text':description} for rank,description in sorted(by_rank.items())]
            abilities.append(skill)
        b = {'id':f'boo-{i}','name':name,'rank':ranks[boo_ui[i]['EJPEMLIMLGN']],'skills':abilities,
             'materials':item_cost(c for row in boo_advance[i] if row['OOHLCKIMDOJ']<60 for c in row['GCABOLAIAIK'])}
        b['acquisition'] = 'Originally available through an event.' if i in event_boos else 'Bangboo Signal Search.'
        passive = next((s['description'].split('\n')[1].split(':')[0] for s in b['skills']
                        if s['group']=='Additional Ability' and '\n' in s['description']), '')
        for kind, labels in [('agent', {a['name']:a['id'] for a in agents}),
                             ('faction', {v:v for v in {*camp_raw.values(),*factions_short.values()}}),
                             ('attribute', {v+' Attribute':v for v in attributes.values()}),
                             ('specialty', {v:v for v in roles.values()}),('attackType',{v:v for v in attack_types.values()})]:
            values = [labels[label] for label in sorted(labels,key=len,reverse=True) if re.search(r'(?<!\w)'+re.escape(label)+r'(?!\w)',passive)]
            if values:
                b['condition'] = [{'kind':kind,'values':values[:1] if kind=='faction' else values,'count':2 if re.search(r'\b2\b',passive) else 1}]
                break
        if i in boo_assets:
            filename = Path(boo_assets[i]['COCIOMBCOGN']).stem
            image(b,f'boo-{i}', assets_url(filename),f'https://enka.network/ui/zzz/{filename}.png')
        boo.append(b)
    # Eous is a story companion, with no regular Signal Search combat slot.
    aliases = collect_aliases(agents)
    banners, upcoming = import_banners(cache, aliases, engines, image)
    for engine in engines:
        featured = next((b for b in reversed(banners) if engine['id'] in b['engineIds']),None)
        if featured and featured['kind'] != 'Special':
            engine['acquisition'] = 'Featured in limited Signal Search.' if engine['rank']=='S' else engine.get('acquisition','Signal Search')
            engine['version'] = featured['version'] if engine['signatureIds'] and all(next(a.get('version') for a in agents if a['id']==i)==featured['version'] for i in engine['signatureIds']) else None
            if engine['version'] is None: engine.pop('version')
        elif engine['signatureIds']:
            known = {a.get('version') for a in agents if a['id'] in engine['signatureIds']}
            if len(known)==1 and '1.0' in known: engine['version']='1.0'
    formats=load(cache/'property')
    stats = []
    for k,f in formats.items():
        label=text(f['Name']); i=int(k); percent='%' in f['Format']
        if label: stats.append({'id':i,'name':label,'scale':100 if percent or i==30501 else 1,'unit':'%' if percent else ''})
    ids = {s['id'] for s in stats}
    for i,name in [(32001,'Sheer Force'),(32401,'Adrenaline Regen')]:
        if i not in ids: stats.append({'id':i,'name':name,'scale':1,'unit':''})
    slot_order = [[11103],[12103],[13103],[11102,12102,13102,20103,21103,31203],
                  [11102,12102,13102,23103,31503,31603,31703,31803,31903,32303],
                  [11102,12102,13102,12202,30502,31402]]
    # Standard S-rank +15 values from the disc stat reference. Added attributes use the
    # same elemental-bonus scale only where the client marks them as slot-5 properties.
    slot_caps = {11103:2200,12103:316,13103:184,11102:3000,12102:3000,13102:4800,20103:2400,
                 21103:4800,31203:92,23103:2400,12202:1800,30502:6000,31402:3000}
    disc_slots = [{'slot':slot,'stats':[{'id':i,'value':slot_caps.get(i,3000)} for i in values if i in ids]}
                  for slot,values in enumerate(slot_order,1)]
    disc_substats = [{'id':i,'value':v} for i,v in [(11103,112),(12103,19),(13103,15),(11102,300),(12102,300),(13102,480),
                         (20103,240),(21103,480),(31203,9),(23203,9)] if i in ids]
    curves = {rank:{'levels':[r['DPKJPJNGJEK'] for r in table['WeaponLevel'] if r['CECLEKPMEJB']==j],
                     'promotions':[{'atk':r['PFPPMCPKOEE'],'secondary':r['PFMPCAJKLBE']} for r in table['WeaponStar'] if r['CECLEKPMEJB']==j]}
              for j,rank in ranks.items()}
    sources = [
        {'name':'HoYoverse Version 3.3 release notes','url':release_notice},
        {'name':'Dimbreath ZenlessData release tables','url':f'https://git.mero.moe/dimbreath/ZenlessData/src/commit/{revision}','revision':revision},
        {'name':'Enka.Network ZZZ data and stat formulas','url':f'https://github.com/EnkaNetwork/API-docs/blob/{enka_revision}/docs/zzz/api.md','revision':enka_revision},
        {'name':'LvlUrArti endgame sample · MIT','url':f'https://huggingface.co/datasets/LvlUrArti/ShiyuDataProcessed/tree/{meta_revision}/{cycle}','revision':meta_revision},
        {'name':'BannerHistory schedule · CC BY 4.0','url':banner_archive},
        {'name':'ZZZ Tools release metadata','url':f'https://github.com/njxaxson/zzz-utils/blob/{versions_revision}/app/public/data/units.json'},
    ]
    data = {'version':version,'checked':checked,'sources':sources,'agents':agents,'engines':engines,'discs':discs,'bangboo':boo,
            'stats':stats,'icons':icons,'materials':list(materials.values()),'engineCurves':curves,'discSlots':disc_slots,'discSubstats':disc_substats}
    write_json(out/'catalog.json',data)
    write_json(out/'banners.json',{'banners':banners,'upcoming':upcoming})
    write_json(out/'observations.json', observations(cache, aliases, engines, discs, boo))
    if download_art:
        download_assets(cache, art)
        for name,path in list(icons.items()):
            if not (root/'public'/path.lstrip('/')).is_file(): icons.pop(name)
        for entry in [*agents,*engines,*discs,*boo,*banners]:
            for field in ('image','portrait'):
                if field in entry and not (root/'public'/entry[field].lstrip('/')).is_file():
                    entry.pop(field)
        write_json(out/'catalog.json',data)
        write_json(out/'banners.json',{'banners':banners,'upcoming':upcoming})
    print(f"{len(agents)} Agents, {len(engines)} W-Engines, {len(discs)} Drive Discs, {len(boo)} Bangboo, {len(banners)} banner records")

def collect_aliases(agents):
    aliases = {key(name):a['id'] for a in agents for name in [a['name'], *a['aliases']]}
    aliases.update({'jane': 'agent-1261','komano':'agent-1441','nangong':'agent-1511','soldier0anby':'agent-1381',
                    'starlightbillykid':'agent-1531','orphieandmagus':'agent-1301','orphiemagnussonandmagus':'agent-1301',
                    'lucianademontefio':'agent-1151','yanagitsukishiro':'agent-1221','yuzuhaukinami':'agent-1411',
                    'gracehoward':'agent-1181','astra':'agent-1311','anbydemarasoldier0':'agent-1381','billystarlight':'agent-1531'})
    return aliases

def import_banners(cache, aliases, engines, image):
    page = (cache/'banner-pickup').read_text()
    streams = []
    for match in re.finditer(r'self\.__next_f\.push\((\[.*?\])\)</script>', page):
        try:
            row=json.loads(match[1])
            if len(row)>1 and isinstance(row[1],str): streams.append(row[1])
        except ValueError:
            continue
    stream=''.join(streams)
    items = [json.JSONDecoder().raw_decode(stream[m.start():])[0] for m in re.finditer(r'\{"id":"ZZZ_',stream)]
    if len(items)<40: raise ValueError('Banner archive layout changed or incomplete.')
    engine_names = {key(e['name']):e['id'] for e in engines}
    signature = {a:e['id'] for e in engines for a in e['signatureIds']}
    bundles = []
    cst=timezone(timedelta(hours=8))
    date=lambda ts:datetime.fromtimestamp(ts/1000,cst).replace(tzinfo=None).isoformat(timespec='minutes')
    for item in items:
        v=item['version']
        if not item.get('startAt') or not item.get('endAt') or tuple(map(int,v.split('.')))> release_limit: continue
        art=item['art'] if isinstance(item.get('art'),dict) else {}
        source=f'https://zenless.hoyoverse.com/en-us/news/{art["newsId"]}' if str(art.get('newsId','')).isdigit() else banner_archive
        if str(art.get('hoyolabPostId','')).isdigit() and source == banner_archive: source=f'https://www.hoyolab.com/article/{art["hoyolabPostId"]}'
        root_id=item['id'].lower().replace('_','-').replace('.','-')
        members = [aliases.get(key(c['enName'])) for c in item['characters']]
        members = list(dict.fromkeys(a for a in members if a))
        for c in item['characters']:
            if key(c['enName']) not in aliases: print('Unmatched banner Agent:', item['id'], c['enName'])
        eids=[]
        for w in art.get('wengines',[]):
            names=[w.get(k,'') for k in ('name','engine','enName','weapon') if isinstance(w.get(k),str)]
            found=next((engine_names[key(n)] for n in names if key(n) in engine_names),None)
            owner=aliases.get(key(w.get('character','')))
            if found or owner in signature: eids.append(found or signature[owner])
        if not eids and item.get('kind') not in ('selector','gift'): eids=[signature[a] for a in members if a in signature]
        s,t=date(item['startAt']),date(item['endAt'])
        special=item.get('kind') in ('selector','custom','gift','special')
        b={'id':root_id,'version':v,'name':item['title'],'starts':s,'ends':t,'kind':'Special' if special else 'Exclusive',
           'agentIds':members,'engineIds':list(dict.fromkeys(eids)) if special else [],'source':source}
        for a in art.get('agents',[]):
            url = a.get('src')
            if isinstance(url,dict): url=url.get('en')
            if isinstance(url,str) and re.match(r'https://(?:fastcdn\.hoyoverse\.com|upload-os-bbs\.hoyolab\.com)/',url):
                image(b,'banner-'+root_id,url);break
        if members: bundles.append(b)
        if not special and eids:
            w={**b,'id':root_id+'-engines','name':f'Version {v} · W-Engine Channel' + (f' · Phase {item["phase"]}' if item.get('phase') else ''),
               'kind':'Dissonant','engineIds':list(dict.fromkeys(eids)),'agentIds':members}
            w.pop('image',None)
            bundles.append(w)
    bundles.sort(key=lambda b:b['starts'],reverse=True)
    upcoming=[{'name':'Version 3.4 special program','date':'2026-11-20T18:30:00+08:00',
              'note':'Official preview broadcast. HoYoverse had not announced the next Signal Search window at last verification.',
              'source':'https://zenless.hoyoverse.com/en-us/news/167352'}]
    return bundles,upcoming

def observations(cache, aliases, engines, discs, boo):
    engine_names, disc_names, boo_names = [{key(v['name']):v['id'] for v in group} for group in [engines,discs,boo]]
    builds={}
    unmatched=collections.Counter()
    for r in load(cache/'meta-builds'):
        a=aliases.get(key(r['char']))
        if not a: unmatched[r['char']]+=1; continue
        w=[]; d=[]
        for i in range(1,11):
            name=r.get(f'weapons_{i}')
            if isinstance(name,str) and (e:=engine_names.get(key(name))):
                w.append({'id':e,'share':r[f'weapons_{i}_app']})
            sets=[name for j in range(1,4) if isinstance(name:=r.get(f'artifacts_{i}_{j}'),str) and name.strip() not in ('','-','0')]
            mapped=[disc_names.get(key(name)) for name in sets]
            if mapped and all(mapped):
                d.append({'ids':list(dict.fromkeys(mapped)),'share':r[f'artifacts_{i}_app']})
        builds[a]={'engines':w[:6],'discs':d[:5],
                  'slots':[[{'name':r[f'drive_slot_{slot}_{j}'],'share':r[f'drive_slot_{slot}_{j}_app']} for j in range(1,4)
                            if isinstance(r[f'drive_slot_{slot}_{j}'],str) and r[f'drive_slot_{slot}_{j}_app']>0] for slot in (4,5,6)],
                  'stats':[{ 'name':label,'value':r[k],'suffix':suffix } for k,label,suffix in [
                      ('base_hp','HP',''),('base_atk','ATK',''),('base_def','DEF',''),('base_impact','Impact',''),('sheer_force','Sheer Force',''),
                      ('crit_rate','CRIT Rate','%'),('crit_dmg','CRIT DMG','%'),('anomaly_mastery','Anomaly Mastery',''),('anomaly_proficiency','Anomaly Proficiency','')
                  ] if isinstance(r[k],(int,float)) and r[k]>0],
                  'substats':[{ 'name':label,'value':r[k],'suffix':suffix } for k,label,suffix in [
                      ('percent_hp_sub','HP','%'),('percent_atk_sub','ATK','%'),('percent_def_sub','DEF','%'),
                      ('crit_rate_sub','CRIT Rate','%'),('crit_dmg_sub','CRIT DMG','%'),('anomaly_proficiency_sub','Anomaly Proficiency','')
                  ] if isinstance(r[k],(int,float)) and r[k]>0],
                  'shiyu':r['app_rate_sd'],'deadly':r['app_rate_da'],'shiyuSample':r['sample_sd'],'deadlySample':r['sample_da']}
    teams={}
    for mode, source in [('Shiyu Defense','meta-sd'),('Deadly Assault','meta-da')]:
        for r in load(cache/source):
            ids=[aliases.get(key(r[k])) for k in ('char_one','char_two','char_three') if isinstance(r.get(k),str)]
            if len(ids)!=3 or None in ids or len(set(ids))!=3 or r['app_rate']<0.03: continue
            squad='-'.join(sorted(i.split('-')[1] for i in ids))
            team=teams.setdefault(squad,{'id':f'observed-{squad}','agentIds':ids,'observations':[]})
            b=r.get('bangboo')
            record={'mode':mode,'share':r['app_rate'],'rank':r['rank']}
            if isinstance(b,str) and (b_id:=boo_names.get(key(b))): record['bangbooId']=b_id
            best=next((x for x in team['observations'] if x['mode']==mode),None)
            if not best: team['observations'].append(record)
            elif record['share']>best['share']: best.update(record)
    if unmatched: print('Endgame aliases to review:',dict(unmatched))
    return {'cycle':cycle,'source':f'https://huggingface.co/datasets/LvlUrArti/ShiyuDataProcessed/tree/{meta_revision}/{cycle}',
            'agents':builds,'teams':list(teams.values())}

def download_assets(cache, art):
    def download(item):
        dest, urls=item
        target=root/'public'/dest.lstrip('/')
        if target.is_file() and target.stat().st_size>300: return (dest,True)
        raw=cache/'art'/Path(dest).with_suffix('.source').name
        for url in urls:
            try:
                if not raw.is_file(): fetch(url,raw)
                target.parent.mkdir(parents=True,exist_ok=True)
                width=64 if '/icon-' in dest else 720 if 'banner-' in dest else (620 if 'agent-' in dest and not dest.endswith('-portrait.webp') else 240)
                subprocess.run(['magick',str(raw),'-auto-orient','-strip','-resize',f'{width}x{width}>','-quality','82',str(target)],
                               check=True,capture_output=True)
                return dest,True
            except (subprocess.CalledProcessError,OSError):
                raw.unlink(missing_ok=True)
        return dest,False
    with ThreadPoolExecutor(max_workers=12) as pool:
        failures=[path for path,ok in pool.map(download,art.items()) if not ok]
    if failures: print('ART UNAVAILABLE (remove unresolved image references before publishing):', ', '.join(failures))

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--cache',type=Path,required=True)
    parser.add_argument('--art',action='store_true',help='Download and convert source assets, with ImageMagick.')
    args=parser.parse_args()
    import_data(args.cache,args.art)
