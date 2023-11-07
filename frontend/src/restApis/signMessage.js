import axios from "axios";
export const signMessage = async (data) => {
  const res = await axios.post("http://localhost:8000/api/signMessage", data, {
    headers: {
      "Content-Type": "application/json",
    },
  });
  return res;
};
