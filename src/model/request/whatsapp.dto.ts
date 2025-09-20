import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class SignDto {
    @IsString()
    sessionName: string;

    @IsOptional()
    @IsString()
    pairingCode?: string;
}

export class SendMessageDto {
    @IsString()
    @IsNotEmpty()
    sessionName: string;

    @IsString()
    @IsNotEmpty()
    to: string; // e.g. "628123456789@c.us"

    @IsString()
    @IsOptional()
    message?: string;

    // Base64 string atau URL ke media
    @IsString()
    @IsOptional()
    mediaBase64?: string;

    @IsString()
    @IsOptional()
    mediaMimeType?: string; // "image/png", "video/mp4", "application/pdf"

    @IsString()
    @IsOptional()
    mediaFileName?: string; // optional, nama file
}