import axios from "axios";
import qs from "qs";

export const singUp = async (data) => {
  console.log(data);
  const res = await axios.post("http://localhost:8000/api/signUp", data, {
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
  });
  return res;
};
