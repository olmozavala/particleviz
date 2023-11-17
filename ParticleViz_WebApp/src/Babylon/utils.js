export function extractNumbersFromString(inputString) {
  // Use regular expression to match numbers within parentheses
  const regex = /\(([^)]+)\)/;
  const match = regex.exec(inputString);

  // If there is a match, split the matched group into an array of strings
  if (match && match[1]) {
    const numbersString = match[1];
    const numbersArray = numbersString.split(",");

    // Convert the array of strings to an array of numbers
    const result = numbersArray.map(Number);

    return result;
  } else {
    // Return an empty array if no match is found
    return [];
  }
}
