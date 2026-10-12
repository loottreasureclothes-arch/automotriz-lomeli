/* Illustrative loan terms; replace with the lender's approved conditions. */
function lomeliPayment(price, percent, months, annualRate = 15) {
  if (![price, percent, months, annualRate].every(Number.isFinite) || price <= 0 || percent < 0 || percent > 100 || months <= 0 || annualRate < 0) throw new Error('Condiciones inválidas');
  const down = price * percent / 100, principal = price - down, rate = annualRate / 1200;
  const payment = rate === 0 ? principal / months : principal * rate / (1 - Math.pow(1 + rate, -months));
  return {down, principal, payment, months, percent, annualRate};
}
