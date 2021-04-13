import "./textarea.scss"
import {useState} from "react";

function TextArea({value, onHide}) {
    const [message, setMessage] = useState("")

    const handleHideMessage = () => {
        onHide(message)
    }

    return (
        <div className={"textarea"}>
            <p className={"chars-length"}>{message.length} / 10000 տառ</p>
            <textarea cols="30" rows="10" onChange={(e) => setMessage(e.target.value)} />
            <div className={"btn"}>
                <button onClick={handleHideMessage}>Թաքցնել</button>
            </div>
        </div>
    )
}

export default TextArea