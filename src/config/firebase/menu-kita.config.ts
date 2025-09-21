import firebaseConfig from 'firebase-admin';

const serviceAccount = {
    "type"                          : process.env.FIREBASE_MENU_KITA_TYPE || '',
    "project_id"                    : process.env.FIREBASE_MENU_KITA_PROJECT_ID || '',
    "private_key_id"                : process.env.FIREBASE_MENU_KITA_PRIVATE_KEY_ID || '',
    "private_key"                   : process.env.FIREBASE_MENU_KITA_PRIVATE_KEY || '',
    "client_email"                  : process.env.FIREBASE_MENU_KITA_CLIENT_EMAIL || '',
    "client_id"                     : process.env.FIREBASE_MENU_KITA_CLIENT_ID || '',
    "auth_uri"                      : process.env.FIREBASE_MENU_KITA_AUTH_URI || '',
    "token_uri"                     : process.env.FIREBASE_MENU_KITA_TOKEN_URI || '',
    "auth_provider_x509_cert_url"   : process.env.FIREBASE_MENU_KITA_PROVIDER_X509_CERT_URL || '',
    "client_x509_cert_url"          : process.env.FIREBASE_MENU_KITA_CLIENT_X509_CERT_URL || '',
    "universe_domain"               : process.env.FIREBASE_MENU_KITA_UNIVERSE_DOMAIN || '',
}

firebaseConfig.initializeApp({
    credential: firebaseConfig.credential.cert(
        JSON.stringify(serviceAccount)
    )
});

export default firebaseConfig;
