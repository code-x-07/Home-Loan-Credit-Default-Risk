export interface NumField {
  key: string;
  label: string;
  hint?: string;
  min: number;
  max: number;
  step: number;
  default: number;
  slider?: boolean;
  prefix?: string;
  suffix?: string;
}

export interface SelectField {
  key: string;
  label: string;
  options: { label: string; columns: Record<string, number> }[];
}

export const FINANCIAL: NumField[] = [
  { key: "AMT_INCOME_TOTAL", label: "Annual income", min: 0, max: 1000000, step: 1000, default: 150000, prefix: "$" },
  { key: "AMT_CREDIT", label: "Loan amount requested", min: 0, max: 2000000, step: 1000, default: 500000, prefix: "$" },
  { key: "AMT_ANNUITY", label: "Annual repayment", min: 0, max: 200000, step: 500, default: 25000, prefix: "$" },
  { key: "AMT_GOODS_PRICE", label: "Property value", min: 0, max: 2000000, step: 1000, default: 450000, prefix: "$" },
];

export const SCORES: NumField[] = [
  { key: "EXT_SOURCE_1", label: "Bureau A score", hint: "0 = highest risk, 1 = lowest", min: 0, max: 1, step: 0.01, default: 0.5, slider: true },
  { key: "EXT_SOURCE_2", label: "Bureau B score", min: 0, max: 1, step: 0.01, default: 0.5, slider: true },
  { key: "EXT_SOURCE_3", label: "Bureau C score", min: 0, max: 1, step: 0.01, default: 0.5, slider: true },
];

// Collected in years, converted to negative days before sending
export const PERSONAL: NumField[] = [
  { key: "AGE_YEARS", label: "Age", min: 18, max: 80, step: 1, default: 35, slider: true, suffix: "yrs" },
  { key: "EMPLOYED_YEARS", label: "Years in current job", min: 0, max: 45, step: 0.5, default: 5, slider: true, suffix: "yrs" },
  { key: "CNT_CHILDREN", label: "Number of children", min: 0, max: 10, step: 1, default: 0 },
  { key: "CNT_FAM_MEMBERS", label: "Family members", min: 1, max: 15, step: 1, default: 2 },
];

export const CATEGORICAL: SelectField[] = [
  {
    key: "education",
    label: "Highest education",
    options: [
      { label: "Secondary", columns: { "NAME_EDUCATION_TYPE_Secondary / secondary special": 1 } },
      { label: "Higher education", columns: { "NAME_EDUCATION_TYPE_Higher education": 1 } },
      { label: "Incomplete higher", columns: { "NAME_EDUCATION_TYPE_Incomplete higher": 1 } },
      { label: "Lower secondary", columns: { "NAME_EDUCATION_TYPE_Lower secondary": 1 } },
      { label: "Academic degree", columns: {} },
    ],
  },
  {
    key: "family",
    label: "Family status",
    options: [
      { label: "Married", columns: { "NAME_FAMILY_STATUS_Married": 1 } },
      { label: "Single / not married", columns: { "NAME_FAMILY_STATUS_Single / not married": 1 } },
      { label: "Separated", columns: { "NAME_FAMILY_STATUS_Separated": 1 } },
      { label: "Widow", columns: { "NAME_FAMILY_STATUS_Widow": 1 } },
      { label: "Civil marriage", columns: {} },
    ],
  },
  {
    key: "income_type",
    label: "Employment type",
    options: [
      { label: "Working", columns: { "NAME_INCOME_TYPE_Working": 1 } },
      { label: "Commercial associate", columns: { "NAME_INCOME_TYPE_Commercial associate": 1 } },
      { label: "State servant", columns: { "NAME_INCOME_TYPE_State servant": 1 } },
      { label: "Pensioner", columns: { "NAME_INCOME_TYPE_Pensioner": 1 } },
      { label: "Student", columns: { "NAME_INCOME_TYPE_Student": 1 } },
      { label: "Unemployed", columns: { "NAME_INCOME_TYPE_Unemployed": 1 } },
      { label: "Businessman", columns: {} },
    ],
  },
  {
    key: "housing",
    label: "Housing situation",
    options: [
      { label: "House / apartment", columns: { "NAME_HOUSING_TYPE_House / apartment": 1 } },
      { label: "Rented apartment", columns: { "NAME_HOUSING_TYPE_Rented apartment": 1 } },
      { label: "With parents", columns: { "NAME_HOUSING_TYPE_With parents": 1 } },
      { label: "Municipal apartment", columns: { "NAME_HOUSING_TYPE_Municipal apartment": 1 } },
      { label: "Office apartment", columns: { "NAME_HOUSING_TYPE_Office apartment": 1 } },
      { label: "Co-op apartment", columns: {} },
    ],
  },
  {
    key: "contract",
    label: "Loan type",
    options: [
      { label: "Cash loan", columns: {} },
      { label: "Revolving loan", columns: { "NAME_CONTRACT_TYPE_Revolving loans": 1 } },
    ],
  },
  {
    key: "own_car",
    label: "Owns a car",
    options: [
      { label: "No", columns: { "FLAG_OWN_CAR_Y": 0 } },
      { label: "Yes", columns: { "FLAG_OWN_CAR_Y": 1 } },
    ],
  },
  {
    key: "own_realty",
    label: "Owns property",
    options: [
      { label: "Yes", columns: { "FLAG_OWN_REALTY_Y": 1 } },
      { label: "No", columns: { "FLAG_OWN_REALTY_Y": 0 } },
    ],
  },
];