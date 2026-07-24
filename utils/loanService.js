
exports.generateAmortizationSchedule = (
  principal,
  annualInterestRate,
  termMonths,
  startDate = new Date()
) => {
  const schedule = [];
  const monthlyRate = annualInterestRate / 100 / 12;

  let monthlyPayment;
  if (monthlyRate === 0) {
    monthlyPayment = principal / termMonths;
  } else {
    monthlyPayment =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
      (Math.pow(1 + monthlyRate, termMonths) - 1);
  }

  for (let i = 1; i <= termMonths; i++) {
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i);

    schedule.push({
      installmentNumber: i,
      dueDate,
      amount: Number(monthlyPayment.toFixed(2)),
      status: "due",
    });
  }

  return schedule;
};