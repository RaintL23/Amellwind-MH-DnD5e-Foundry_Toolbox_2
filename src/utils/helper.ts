export const GetRandomNumer1to20 = () => {
  return Math.floor(Math.random() * 20) + 1;
};

export const isNumberInRange = (range: string, number: number): boolean => {
  if (!range.includes("-")) {
    const single = Number(range.trim());
    return !isNaN(single) && number === single;
  }

  const [minStr, maxStr] = range.split("-");
  const min = Number(minStr);
  const max = Number(maxStr);
  if (isNaN(min) || isNaN(max)) return false;

  return number >= min && number <= max;
};
