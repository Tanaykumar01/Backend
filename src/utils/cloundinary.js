import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadResult = async (localFilePath) => {
    try {
        if(!localFilePath) return null;
        const result = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        })
        console.log("file has been uploaded successfully" , result.url);
        fs.unlinkSync(localFilePath)
        return result;
    } catch (error) {
        fs.unlinkSync(localFilePath);
        // console.log("file has been deleted successfully");
        return null;
    }
}

export { uploadResult };
// const CLOUDINARY_URL=cloudinary://393265988271789:53qZs6Jh0JcduQueAmAAgOXcxkU@djaygbwg5