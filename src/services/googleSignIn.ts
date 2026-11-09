// Metro resuelve googleSignIn.native.ts o googleSignIn.web.ts en cada plataforma.
export async function googleSignIn(): Promise<void> { throw new Error('Plataforma no compatible con Google.'); }
