import { roundMoney } from "./credit-plan";

export type ScheduleInput = { principal: number; annualRate: number; installments: number; system: "FRANCES" | "ALEMAN"; periodicityMonths: number; firstDueDate: Date; precision: number };

function addMonths(date: Date, months: number) { const result = new Date(date); result.setUTCMonth(result.getUTCMonth() + months); return result; }

export function buildAmortizationSchedule(input: ScheduleInput) {
  if (input.principal <= 0 || input.installments < 1) throw new Error("El capital y las cuotas deben ser positivos.");
  const rate = input.annualRate / 100 / 12 * input.periodicityMonths;
  let balance = input.principal;
  const frenchPayment = rate === 0 ? input.principal / input.installments : input.principal * rate / (1 - Math.pow(1 + rate, -input.installments));
  const germanCapital = input.principal / input.installments;
  const installments = [];
  for (let index = 1; index <= input.installments; index++) {
    const interest = roundMoney(balance * rate, input.precision);
    const capital = index === input.installments ? roundMoney(balance, input.precision) : roundMoney(input.system === "FRANCES" ? frenchPayment - interest : germanCapital, input.precision);
    const payment = roundMoney(capital + interest, input.precision);
    balance = roundMoney(Math.max(0, balance - capital), input.precision);
    installments.push({ number: index, dueDate: addMonths(input.firstDueDate, (index - 1) * input.periodicityMonths), capital, interest, payment, balance });
  }
  return { installments, totalInterest: roundMoney(installments.reduce((sum, item) => sum + item.interest, 0), input.precision), total: roundMoney(installments.reduce((sum, item) => sum + item.payment, 0), input.precision) };
}
