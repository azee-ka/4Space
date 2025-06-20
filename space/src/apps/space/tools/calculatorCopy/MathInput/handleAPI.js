import axios from 'axios';
import apiCall from '../../../../../utils/api';


const sendLatex = (latex, handleApiResponse, mode) => {

  let data;
  data = {
    expression: latex,
    oper: 'tex',
    mode: mode,
  };

  // Make a POST request to the backend API
  apiCall(`space/tools/calculator/submit-expression/`, 'POST', data)
    .then((response) => {
      handleApiResponse(response.data);
    })
    .catch((error) => {
      // Handle any errors that occur during the request
      console.error(error);

      const err_data = {
        result: {
          'output': null,
          'userExpr': data.expression,
          'decimal': null,
          'isInteger': false,
          'isExact': false,
        }
      }
      handleApiResponse(err_data);
    });
};

export default sendLatex;
