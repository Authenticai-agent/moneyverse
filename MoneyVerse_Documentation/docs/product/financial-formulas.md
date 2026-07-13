# Financial Formulas

All calculations are educational estimates. Use decimal-safe arithmetic and explicit rounding.

## Compound growth

`FV = PV(1 + r/n)^(nt)`

Inputs: principal, annual rate, compounds per year, years.  
Output: future value in minor units after final rounding.

## Simple interest

`A = P(1 + rt)`

## Inflation-adjusted value

`RealValue = NominalValue / (1 + inflationRate)^years`

## Unit price

`UnitPrice = TotalPrice / Quantity`

## Gross profit

`GrossProfit = Revenue - CostOfGoodsSold`

## Margin

`Margin = GrossProfit / Revenue`

Handle zero revenue explicitly.

## Break-even units

`FixedCosts / (PricePerUnit - VariableCostPerUnit)`

Reject non-positive contribution margin.

## Loan payment

`Payment = P * r(1+r)^n / ((1+r)^n - 1)`

Document whether `r` is monthly and `n` is number of payments.

## Rules

- Store money as integer minor units.
- Perform intermediate calculations using a decimal library.
- Define rounding mode per calculator.
- Include boundary, zero, negative, overflow, and precision tests.
- Display assumptions next to results.
