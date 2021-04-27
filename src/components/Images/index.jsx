import {forwardRef, useState} from "react";
import {decode} from "../../steno";
import "./images.scss"

const Images = forwardRef(({encodedImg, setMessage}, ref) => {

    const [uploadedImage, setUploadedImage] = useState("")

    const handleSelectImage = (e) => {
        setUploadedImage(URL.createObjectURL(e.target.files[0]))
    }

    const handleDecode = () => {
        const message = decode(ref.current)
        setMessage(message);
    }

    return (
        <div className={"images"}>
            <div className={"column"}>
                <label htmlFor="uploadImage" className={"upload-image-label"}>
                    <img src={uploadedImage || "https://i.stack.imgur.com/y9DpT.jpg"} ref={ref} alt={"encode"}/>
                    <input id={"uploadImage"} type="file" onChange={handleSelectImage} className={"upload-image"} />
                </label>
                {
                    uploadedImage && <div className={"btn"} onClick={handleDecode}>Կարդալ</div>
                }
            </div>
            {encodedImg && (
                <div className={"column"}>
                    <img src={encodedImg} className={"decodet-image"} alt={"decoded"}/>
                    <a
                        id="download"
                        href={encodedImg.replace("image/png", "image/octet-stream")}
                        className="btn"
                        download={"cover.png"}
                        rel="nofollow"
                    >
                        Ներբեռնել
                    </a>
                </div>
            )}
        </div>
    )
})

export default Images