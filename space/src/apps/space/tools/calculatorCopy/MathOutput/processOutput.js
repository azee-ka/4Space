export function processOutput(arr, operation) {
  return toOutput(arr, operation);
}

function toOutput(arr, operation) {
  let output;
  const result = arr.result;

  if (result.output === null) {

    let outputStr = "";
    console.log(result)
    outputStr = "\\left[{  } " + result.userExpr + " \\right] : Invalid";
    output = {
      outputString: outputStr,
      outputStringForDecimal: null,
      solution: null,
      isLarge: null,
    }
  }
  else {
    output = createOutputString(result, operation);
  }

  return output;
}




function createOutputString(result, operation) {
  let outputString;
  if (operation === "tex") {
    outputString = createGeneralOutputString(result);
  } else {
    outputString += createSpecialOutputString(result, operation);
  }
  return outputString;
}

function createGeneralOutputString(result) {
  let outputString = '';
  let outputStringForDecimal = "";
  let isLarge = false;
  let output = '';
  let isOutputArrayOfEquations = Array.isArray(result.output);
  let isDecimalArrayOfEquations = Array.isArray(result.decimal);

  outputString = "" + result.userExpr + " = " + result.output + "";
  if (result.output !== null && !isOutputArrayOfEquations && !isDecimalArrayOfEquations) {
    output = result.output.replace('C + ', "");

    if ((result.output).length <= 200 && !isOutputArrayOfEquations && !isDecimalArrayOfEquations) {
      if (result.isInteger === false && result.decimal !== null && output !== result.decimal && result.decimal !== 'None') {

        if (result.userExpr !== result.output) {

          if (result.isExact === true) {
            outputString = result.userExpr + ' = ' + result.output + ' = ' + result.decimal;
            outputStringForDecimal = result.decimal;
          } else if (result.isExact === false) {
            outputString = result.userExpr + ' = ' + result.output + ' \\approx ' + result.decimal;
            outputStringForDecimal = result.decimal;
          }
        }
        else if (result.userExpr === result.output) {
          if (result.isExact === true) {
            outputString = result.userExpr + ' = ' + result.decimal;
            outputStringForDecimal = result.decimal;
          } else if (result.isExact === false) {
            outputStringForDecimal = result.decimal;
            outputString = result.output + ' \\approx ' + result.decimal;
          }
        }
      } else if (result.isInteger === true) {
        outputString = result.userExpr + ' = ' + result.output;
      }
    }
    else if ((result.output).length > 200 && result.decimal !== null && result.isInteger === false && !isOutputArrayOfEquations) {
      isLarge = true;

      if (result.isExact === true) {
        outputStringForDecimal = result.decimal;
      }
      else if (result.isExact === false) {
        outputStringForDecimal = ' \\approx ' + result.decimal
      }
    } else if ((result.output).length > 15 && result.isInteger === true && result.decimal === null) {
      isLarge = true;
      outputStringForDecimal = result.decimal;
    }
  } else {
    if (result.output.join(', ') && result.decimal !== null) {
      outputString = result.userExpr + ":\\hspace{0.2cm}" + result.output.join(', ');
      outputStringForDecimal = result.decimal.join(', ');
      isLarge = true;
    } else {
      outputString = result.userExpr + ":\\hspace{0.2cm}" + result.output.join(', ');
      outputStringForDecimal = "";
      isLarge = false;
    }
  }


  const obj = {
    outputString: outputString,
    outputStringForDecimal: outputStringForDecimal,
    solution: result,
    isLarge: isLarge,
  }

  return obj;
}




function createSpecialOutputString(result, operation) {
  let outputString = "" + operation + "\\;\\;\\;" + result.user_expr + " = " + result.output + "";

  if (result.integer_check === false && (result.decimal_output !== null && result.decimal_output !== 'None')) {
    if (result.float_check !== "exact") {
      outputString = "" + operation + "\\;\\;\\;" + result.user_expr + " = " + result.output + " \\approx " + result.decimal_output + "";
    } else if (result.float_check === "exact") {
      outputString = "" + operation + "\\;\\;\\;" + result.user_expr + " = " + result.output + " = " + result.decimal_output + "";
    }
  } else if (result.integer_check === true) {
    outputString = "" + operation + "\\;\\;\\;" + result.user_expr + " = " + result.output + "";
  }

  return outputString;
}