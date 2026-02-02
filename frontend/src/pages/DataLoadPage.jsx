import { useState } from "react";

export default function DataLoadPage() {
  const [message, setMessage] = useState("");

  const sendRequest = async () => {
    try {
      const response = await fetch("api/dataload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: "data",
          value: 1,
        }),
      });

      const data = await response.json();
      setMessage("Odesláno OK");
      console.log(data);
    } catch (err) {
      console.error(err);
      setMessage("Chyba při odesílání");
    }
  };

  return (
    <div>
      <h1>POST request</h1>
      <button onClick={sendRequest}>Odeslat</button>
      <p>{message}</p>
    </div>
  );
}
