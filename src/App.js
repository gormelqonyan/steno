import {useRef, useState} from "react";
import TextArea from "./components/TextArea";
import Images from "./components/Images";

import {encode} from "./steno";

function App() {
    const [encodedImg, setEncodedImg] = useState("");
    const [message, setMessage] = useState("");

    const onHide = (message) => {
        const src = encode(message, imgRef.current);
        setEncodedImg(src)
    }

    const imgRef = useRef();

  return (
      <main>
        <TextArea onHide={onHide}  />
        <Images ref={imgRef} encodedImg={encodedImg} setMessage={setMessage}/>
        <h3>Թաքնագրված տեկստը ՝</h3>
        <p>{message}</p>
      </main>
  )
}

export default App