export const normalizePhoneNumber = (input: string): string => {
    let cleaned = input.replace(/\D/g, '');

    if (cleaned.startsWith('62')) {
        cleaned = '0' + cleaned.slice(2);
    } else if (cleaned.startsWith('8')) {
        cleaned = '0' + cleaned;
    } else if (cleaned.startsWith('0')) {
    } else {
        return input;
    }

    return cleaned;
}
