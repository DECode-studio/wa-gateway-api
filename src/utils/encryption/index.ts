import CryptoJS from "crypto-js";

const secretKey = process.env.ENCRYPTION_SECRET_KEY || ''

export const encryptData = (data: string) => {
    const encrypted = CryptoJS.AES.encrypt(data, secretKey).toString();
    return encrypted;
};

export const decryptData = (encryptedData: string) => {
    const bytes = CryptoJS.AES.decrypt(encryptedData, secretKey);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted;
};
