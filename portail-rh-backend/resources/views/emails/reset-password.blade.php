<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Réinitialisation de votre mot de passe</title>
</head>
<body style="margin:0;padding:0;background:#F4F4F5;font-family:'Segoe UI',Arial,sans-serif;color:#18181B;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F4F5;padding:40px 20px;">
        <tr>
            <td align="center">
                <table width="560" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.08);">

                    <!-- Header -->
                    <tr>
                        <td align="center" style="background:#0A0A0F;padding:32px 24px;">
                            <div style="font-size:28px;font-weight:700;color:#FFFFFF;letter-spacing:-0.5px;">
                                Arab<span style="color:#FF2D20;">Soft</span>
                            </div>
                            <div style="font-size:12px;color:rgba(255,255,255,0.6);margin-top:6px;letter-spacing:1px;text-transform:uppercase;">
                                Portail RH
                            </div>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding:40px 40px 20px 40px;">
                            <h1 style="font-size:22px;font-weight:700;color:#18181B;margin:0 0 16px 0;">
                                Bonjour {{ $user->prenom }},
                            </h1>
                            <p style="font-size:14px;line-height:1.6;color:#52525B;margin:0 0 16px 0;">
                                Nous avons reçu une demande de réinitialisation de votre mot de passe et l'administrateur RH l'a <strong>approuvée</strong>.
                                Si vous n'avez pas fait cette demande, ignorez simplement cet email.
                            </p>
                            <p style="font-size:14px;line-height:1.6;color:#52525B;margin:0 0 28px 0;">
                                Pour réinitialiser votre mot de passe, cliquez sur le bouton ci-dessous :
                            </p>

                            <!-- CTA Button -->
                            <table cellpadding="0" cellspacing="0" align="center" style="margin:0 auto 28px auto;">
                                <tr>
                                    <td align="center" style="background:#FF2D20;border-radius:10px;">
                                        <a href="{{ $resetUrl }}"
                                           style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:600;color:#FFFFFF;text-decoration:none;font-family:'Segoe UI',Arial,sans-serif;">
                                            Réinitialiser mon mot de passe
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="font-size:12px;line-height:1.6;color:#71717A;margin:0 0 8px 0;">
                                Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :
                            </p>
                            <p style="font-size:12px;line-height:1.6;color:#FF2D20;margin:0 0 24px 0;word-break:break-all;">
                                {{ $resetUrl }}
                            </p>

                            <div style="background:#FFF1F0;border-left:3px solid #FF2D20;padding:12px 16px;border-radius:6px;margin-top:16px;">
                                <p style="font-size:13px;color:#18181B;margin:0;">
                                    ⏱ <strong>Ce lien expire dans 15 minutes</strong> pour des raisons de sécurité.
                                </p>
                            </div>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background:#FAFAFA;padding:20px 40px;border-top:1px solid #E4E4E7;">
                            <p style="font-size:11px;color:#A1A1AA;margin:0;text-align:center;">
                                Portail RH ArabSoft &copy; 2026 &middot; Tous droits réservés
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
