import Image from "next/image";

const ImageViewer = ({ imagePath }: { imagePath: string }) => {
  return <Image src={imagePath} fill alt="Automation Screenshot" />;
};

export default ImageViewer;
