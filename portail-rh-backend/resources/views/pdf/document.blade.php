<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>{{ $demande->motif ?? 'Document Officiel' }} — ArabSoft</title>
    <style>
        @page { margin: 0; }
        * { box-sizing: border-box; }
        body {
            margin: 0;
            padding: 0;
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 10.5pt;
            color: #1a1a2e;
            background: #ffffff;
        }

        /* =============== HEADER NOIR =============== */
        .header {
            background: #0a0a0f;
            color: #ffffff;
            padding: 22px 40px;
        }
        .header-table { width: 100%; border-collapse: collapse; }
        .header-table td { vertical-align: middle; }
        .logo-box {
            width: 44px;
            height: 44px;
            background: #FF2D20;
            border-radius: 10px;
            color: #ffffff;
            font-size: 22pt;
            font-weight: bold;
            text-align: center;
            line-height: 44px;
            display: inline-block;
        }
        .brand-name {
            font-size: 18pt;
            font-weight: bold;
            letter-spacing: 0.5px;
            margin-left: 12px;
            color: #ffffff;
        }
        .brand-tagline {
            font-size: 8.5pt;
            color: #a1a1aa;
            margin-left: 12px;
            letter-spacing: 0.8px;
            text-transform: uppercase;
        }
        .contact-info {
            font-size: 8.5pt;
            color: #d4d4d8;
            text-align: right;
            line-height: 1.5;
        }

        /* =============== BANDE ROUGE =============== */
        .title-bar {
            background: #FF2D20;
            color: #ffffff;
            padding: 16px 40px;
        }
        .doc-title {
            font-size: 16pt;
            font-weight: bold;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            margin: 0;
        }
        .doc-ref {
            font-size: 9pt;
            letter-spacing: 1px;
            margin-top: 3px;
            opacity: 0.95;
        }

        /* =============== CONTENU =============== */
        .body-wrap {
            padding: 28px 40px 20px 40px;
        }
        .status-badge {
            display: inline-block;
            background: #dcfce7;
            border: 1px solid #22C55E;
            color: #15803d;
            padding: 5px 14px;
            border-radius: 20px;
            font-size: 9pt;
            font-weight: bold;
            letter-spacing: 0.5px;
            margin-bottom: 18px;
        }

        .section-title {
            font-size: 10pt;
            font-weight: bold;
            color: #FF2D20;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            border-bottom: 1.5px solid #FF2D20;
            padding-bottom: 4px;
            margin: 18px 0 10px 0;
        }

        .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
        }
        .info-table td {
            padding: 7px 10px;
            font-size: 10pt;
            border-bottom: 1px solid #e4e4e7;
        }
        .info-table tr:nth-child(even) td { background: #fafafa; }
        .info-table td.label {
            font-weight: bold;
            color: #52525b;
            width: 35%;
            text-transform: uppercase;
            font-size: 8.5pt;
            letter-spacing: 0.5px;
        }
        .info-table td.value { color: #18181b; font-weight: 500; }

        .official-text {
            padding: 16px 20px;
            background: #f7f7fb;
            border-left: 4px solid #FF2D20;
            border-radius: 4px;
            line-height: 1.7;
            font-size: 10.5pt;
            color: #27272a;
            text-align: justify;
            margin-top: 10px;
        }
        .official-text strong { color: #0a0a0f; }

        /* =============== VALIDITÉ =============== */
        .validity-bar {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 6px;
            padding: 10px 14px;
            margin-top: 18px;
            font-size: 9.5pt;
            color: #78350f;
            text-align: center;
        }
        .validity-bar strong { color: #7c2d12; }

        /* =============== QR CODE =============== */
        .qr-verification {
            border: 1.5px dashed #FF2D20;
            padding: 14px;
            border-radius: 8px;
            margin-top: 20px;
            background: #fffafa;
        }
        .qr-code-cell {
            width: 150px;
            vertical-align: middle;
            padding: 8px;
            text-align: center;
        }
        /* Grille QR code : chaque <span> = 1 module = carré 3px */
        .qr-grid {
            display: inline-block;
            background: #ffffff;
            padding: 6px;
            border: 1px solid #e4e4e7;
            border-radius: 4px;
            line-height: 0;
            font-size: 0;
        }
        .qr-grid > div {
            display: block;
            height: 3px;
            line-height: 0;
            font-size: 0;
            white-space: nowrap;
        }
        .qr-grid > div > span {
            display: inline-block;
            width: 3px;
            height: 3px;
            vertical-align: top;
        }
        .qr-info-cell {
            vertical-align: middle;
            padding: 4px 14px;
            font-size: 9pt;
            color: #1a1a2e;
            line-height: 1.6;
        }
        .qr-info-cell .qr-title {
            color: #FF2D20;
            font-size: 10.5pt;
            font-weight: bold;
            margin-bottom: 4px;
            display: block;
        }
        .qr-info-cell code {
            background: #f7f7fb;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 8.5pt;
            color: #3f3f46;
        }

        /* =============== SIGNATURES =============== */
        .sig-wrap {
            margin-top: 34px;
            width: 100%;
        }
        .sig-table { width: 100%; border-collapse: collapse; }
        .sig-table td {
            width: 50%;
            vertical-align: top;
            padding: 10px;
        }
        .sig-label {
            font-size: 8.5pt;
            color: #71717a;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .sig-line {
            border-bottom: 1px solid #18181b;
            height: 55px;
            margin-bottom: 6px;
        }
        .sig-name {
            font-size: 9pt;
            color: #3f3f46;
        }
        .stamp {
            border: 2px dashed #FF2D20;
            border-radius: 50%;
            width: 110px;
            height: 110px;
            margin: 0 auto;
            padding: 12px;
            text-align: center;
            color: #FF2D20;
            font-weight: bold;
            font-size: 8.5pt;
            line-height: 1.3;
        }
        .stamp-inner {
            padding-top: 28px;
        }

        /* =============== FOOTER =============== */
        .footer {
            margin-top: 28px;
            padding: 14px 40px;
            background: #0a0a0f;
            color: #a1a1aa;
            font-size: 8pt;
            line-height: 1.5;
        }
        .footer-table { width: 100%; border-collapse: collapse; }
        .footer-table td { vertical-align: top; color: #a1a1aa; }
        .footer-warn {
            text-align: right;
            color: #FF2D20;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.8px;
        }
    </style>
</head>
<body>

{{-- ============= HEADER ============= --}}
<div class="header">
    <table class="header-table">
        <tr>
            <td style="width: 60%;">
                <table style="border-collapse: collapse;">
                    <tr>
                        <td><span class="logo-box">A</span></td>
                        <td style="padding-left: 8px;">
                            <div class="brand-name">ArabSoft</div>
                            <div class="brand-tagline">Portail des Ressources Humaines</div>
                        </td>
                    </tr>
                </table>
            </td>
            <td class="contact-info">
                Rue 8368, Montplaisir<br>
                1073 Tunis — Tunisie<br>
                Tél : +216 71 95 12 48<br>
                arabsoft@arabsoft.com.tn
            </td>
        </tr>
    </table>
</div>

{{-- ============= BANDE ROUGE ============= --}}
<div class="title-bar">
    <div class="doc-title">{{ $demande->motif ?? 'Document Officiel' }}</div>
    <div class="doc-ref">Référence : {{ $ref }}</div>
</div>

{{-- ============= CORPS ============= --}}
<div class="body-wrap">

    <div class="status-badge">&#10004; Demande Approuvée</div>

    <div class="section-title">Informations du Bénéficiaire</div>
    <table class="info-table">
        <tr>
            <td class="label">Nom complet</td>
            <td class="value">{{ $demande->employee->prenom ?? '' }} {{ $demande->employee->nom ?? '' }}</td>
        </tr>
        <tr>
            <td class="label">Matricule</td>
            <td class="value">EMP-{{ str_pad($demande->employee->id ?? 0, 4, '0', STR_PAD_LEFT) }}</td>
        </tr>
        <tr>
            <td class="label">Poste</td>
            <td class="value">{{ $demande->employee->poste ?? 'Non renseigné' }}</td>
        </tr>
        <tr>
            <td class="label">Département</td>
            <td class="value">{{ $demande->employee->departement ?? 'Non renseigné' }}</td>
        </tr>
        <tr>
            <td class="label">Email professionnel</td>
            <td class="value">{{ $demande->employee->email ?? '' }}</td>
        </tr>
    </table>

    <div class="section-title">Objet du Document</div>

    @php
        $motif       = $demande->motif ?? '';
        $prenom      = $demande->employee->prenom ?? '';
        $nom         = $demande->employee->nom ?? '';
        $poste       = $demande->employee->poste ?? 'collaborateur';
        $departement = $demande->employee->departement ?? 'R&D';
    @endphp

    @if ($motif === 'Attestation de travail')
        <div class="official-text">
            La Direction des Ressources Humaines d'<strong>ArabSoft</strong> soussignée certifie
            par la présente que Monsieur/Madame <strong>{{ $prenom }} {{ $nom }}</strong>
            est employé(e) au sein de la société ArabSoft en qualité de <strong>{{ $poste }}</strong>
            au département <strong>{{ $departement }}</strong>.
            <br><br>
            La présente attestation est délivrée à l'intéressé(e) à sa demande,
            pour servir et valoir ce que de droit.
        </div>

    @elseif ($motif === 'Attestation de salaire')
        <div class="official-text">
            La Direction des Ressources Humaines d'<strong>ArabSoft</strong> soussignée certifie
            que Monsieur/Madame <strong>{{ $prenom }} {{ $nom }}</strong>,
            occupant le poste de <strong>{{ $poste }}</strong> au département
            <strong>{{ $departement }}</strong>, perçoit un salaire mensuel brut conformément
            à la grille salariale en vigueur au sein de la société.
            <br><br>
            La présente attestation est délivrée à l'intéressé(e) pour servir
            dans le cadre de démarches bancaires ou administratives.
        </div>

    @elseif ($motif === 'Bulletin de paie')
        <div class="official-text">
            Document informatif — Bulletin de paie du mois de
            <strong>{{ \Carbon\Carbon::now()->locale('fr')->isoFormat('MMMM') }}</strong>
            de l'année <strong>{{ now()->year }}</strong>.
            <br><br>
            <strong>Bénéficiaire :</strong> {{ $prenom }} {{ $nom }}<br>
            <strong>Matricule :</strong> EMP-{{ str_pad($demande->employee->id ?? 0, 4, '0', STR_PAD_LEFT) }}<br>
            <strong>Poste :</strong> {{ $poste }}<br>
            <strong>Département :</strong> {{ $departement }}
            <br><br>
            Le bulletin détaillé (salaire brut, cotisations sociales, net à payer) est disponible
            auprès du service de la paie. Ce document atteste du statut d'employé actif(ve)
            au sein d'ArabSoft à la date d'émission.
        </div>

    @elseif ($motif === 'Certificat de présence')
        <div class="official-text">
            La Direction des Ressources Humaines d'<strong>ArabSoft</strong> soussignée certifie
            que Monsieur/Madame <strong>{{ $prenom }} {{ $nom }}</strong>,
            <strong>{{ $poste }}</strong> au département <strong>{{ $departement }}</strong>,
            est présent(e) et actif(ve) à son poste de travail à la date d'émission
            du présent certificat.
            <br><br>
            Ce document est délivré à la demande de l'intéressé(e) pour servir
            et valoir ce que de droit.
        </div>

    @else
        <div class="official-text">
            Document officiel émis par la Direction des Ressources Humaines d'<strong>ArabSoft</strong>
            au profit de Monsieur/Madame <strong>{{ $prenom }} {{ $nom }}</strong>,
            <strong>{{ $poste }}</strong> — {{ $departement }}.
        </div>
    @endif

    {{-- ============= VALIDITÉ ============= --}}
    <div class="validity-bar">
        &#9201; Document valide jusqu'au <strong>{{ $expireLe->format('d/m/Y') }}</strong>
        (validité : 1 mois à compter de la date d'émission)
    </div>

    {{-- ============= QR CODE ============= --}}
    <div class="qr-verification">
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td class="qr-code-cell">
                    {!! $qrCode !!}
                </td>
                <td class="qr-info-cell">
                    <span class="qr-title">&#128274; Vérification d'authenticité</span>
                    Scannez ce QR code ou visitez l'URL ci-dessous pour vérifier
                    l'authenticité de ce document auprès d'ArabSoft :<br>
                    <code>localhost:5173/verify?ref={{ $ref }}</code><br><br>
                    <strong>Référence :</strong> {{ $ref }}<br>
                    <strong>Émis le :</strong> {{ $emisLe->format('d/m/Y \à H:i') }}<br>
                    <strong>Valide jusqu'au :</strong> {{ $expireLe->format('d/m/Y') }}
                </td>
            </tr>
        </table>
    </div>

    {{-- ============= SIGNATURES ============= --}}
    <div class="sig-wrap">
        <table class="sig-table">
            <tr>
                <td>
                    <div class="sig-label">Signature de l'Employé</div>
                    <div class="sig-line"></div>
                    <div class="sig-name">{{ $prenom }} {{ $nom }}</div>
                </td>
                <td style="text-align: center;">
                    <div class="sig-label" style="text-align: center;">Cachet &amp; Signature DRH</div>
                    <div class="stamp">
                        <div class="stamp-inner">
                            ArabSoft<br>
                            Direction RH<br>
                            {{ now()->format('d/m/Y') }}
                        </div>
                    </div>
                </td>
            </tr>
        </table>
    </div>
</div>

{{-- ============= FOOTER ============= --}}
<div class="footer">
    <table class="footer-table">
        <tr>
            <td>
                Généré le {{ now()->format('d/m/Y \à H:i') }} — Référence : <strong style="color:#ffffff;">{{ $ref }}</strong><br>
                ArabSoft S.A. — Siret immatriculée en Tunisie
            </td>
            <td class="footer-warn">
                Document Officiel<br>
                Ne pas photocopier sans autorisation
            </td>
        </tr>
    </table>
</div>

</body>
</html>
