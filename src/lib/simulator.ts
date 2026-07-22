export interface SimulatorInputs {
  smes: number;
  c2: number;
  enterprise: number;
  accelerators: number;
}

export interface SimulatorOutputs {
  grossRevenue: number;
  subcontractorPayouts: number;
  aiCompute: number;
  opex: number;
  ebitda: number;
  incomeMultiplier: number;
}

export const presets: Record<"Conservative" | "Base" | "Upside", SimulatorInputs> = {
  Conservative: { smes: 20, c2: 1, enterprise: 1, accelerators: 5 },
  Base: { smes: 60, c2: 3, enterprise: 4, accelerators: 15 },
  Upside: { smes: 150, c2: 7, enterprise: 10, accelerators: 35 },
};

export function simulate(i: SimulatorInputs): SimulatorOutputs {
  const grossRevenue =
    i.smes * 800 + i.c2 * 59988 + i.enterprise * 12999 + i.accelerators * 2499;
  const subcontractorPayouts =
    i.smes * 75 + i.c2 * 18000 + i.enterprise * 8000 + i.accelerators * 1000;
  const aiCompute = i.smes * 12 + i.c2 * 2400 + i.enterprise * 500 + i.accelerators * 100;
  const opex = grossRevenue < 50000 ? 1500 : grossRevenue < 300000 ? 2400 : 4000;
  const ebitda = grossRevenue - subcontractorPayouts - aiCompute - opex;
  const incomeMultiplier = ebitda / 1500;
  return { grossRevenue, subcontractorPayouts, aiCompute, opex, ebitda, incomeMultiplier };
}