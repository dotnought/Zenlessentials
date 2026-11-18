export const tierOrder = ['T0', 'T0.5', 'T1', 'T1.5', 'T2'] as const
export type Tier = (typeof tierOrder)[number]

export const rankedAgents = {
  T0: [
    'agent-1511', 'agent-1621', 'agent-1481', // Stun
    'agent-1381', 'agent-1591', 'agent-1631', // Attack & Armorer
    'agent-1581', 'agent-1561', 'agent-1541', // Anomaly
  ],
  'T0.5': [
    'agent-1211', 'agent-1411', 'agent-1451', 'agent-1491', // Support & Defense
    'agent-1571', // Stun
    'agent-1371', 'agent-1471', 'agent-1051', // Rupture
    'agent-1021', 'agent-1521', 'agent-1611', 'agent-1201', 'agent-1551', 'agent-1431', // Attack & Armorer
    'agent-1401', 'agent-1091', 'agent-1501', 'agent-1641', // Anomaly
  ],
  T1: [
    'agent-1031', 'agent-1311', 'agent-1341', 'agent-1421', // Support & Defense
    'agent-1141', 'agent-1391', 'agent-1161', 'agent-1361', 'agent-1101', 'agent-1251', // Stun
    'agent-1531', // Rupture
    'agent-1461', 'agent-1301', 'agent-1041', 'agent-1321', 'agent-1191', 'agent-1291', // Attack & Armorer
    'agent-1171', 'agent-1261', 'agent-1181', 'agent-1281', 'agent-1331', // Anomaly
  ],
  'T1.5': [
    'agent-1131', 'agent-1151', 'agent-1121', 'agent-1071', 'agent-1271', // Support & Defense
    'agent-1351', // Stun
    'agent-1441', // Rupture
    'agent-1081', 'agent-1061', 'agent-1241', // Attack & Armorer
    'agent-1221', // Anomaly
  ],
  T2: ['agent-1011', 'agent-1111'], // Stun, Attack
} satisfies Record<Tier, string[]>

export const tierByAgent = new Map(tierOrder.flatMap((tier) => rankedAgents[tier].map((id) => [id, tier] as const)))
