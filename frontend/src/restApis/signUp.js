import axios from "axios";
export const singUp = async (data) => {
  const res = await axios.post("http://localhost:8000/api/signUp", data);
  return res;
};
