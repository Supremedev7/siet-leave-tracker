export const DEPARTMENTS = [
  { code: "CSE", name: "Computer Science & Engineering" },
  { code: "ECE", name: "Electronics & Communication Engineering" },
  { code: "EEE", name: "Electrical & Electronics Engineering" },
  { code: "ME",  name: "Mechanical Engineering" },
  { code: "CE",  name: "Civil Engineering" },
  { code: "S&H", name: "Science & Humanities" },
] as const;

export const ACADEMIC_YEARS = [1, 2, 3, 4] as const;
export const SECTIONS = ["A", "B", "C", "D"] as const;
export const SEMESTERS = [1, 2] as const;

export const getDepartmentName = (code: string): string => {
  const found = DEPARTMENTS.find((d) => d.code === code);
  return found ? found.name : code;
};
