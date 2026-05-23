<?php
/**
 * Convertit un fichier Markdown en PDF via DomPDF + CommonMark (GFM tables).
 * Usage: php tools/md-to-pdf.php <input.md> <output.pdf>
 */

require __DIR__ . '/../vendor/autoload.php';

use League\CommonMark\GithubFlavoredMarkdownConverter;
use Dompdf\Dompdf;
use Dompdf\Options;

if ($argc < 3) {
    fwrite(STDERR, "Usage: php md-to-pdf.php <input.md> <output.pdf>\n");
    exit(1);
}

$input  = $argv[1];
$output = $argv[2];

if (!file_exists($input)) {
    fwrite(STDERR, "Fichier introuvable: $input\n");
    exit(1);
}

$md = file_get_contents($input);

// Markdown → HTML (avec tables GFM)
$converter = new GithubFlavoredMarkdownConverter([
    'html_input'         => 'allow',
    'allow_unsafe_links' => false,
]);
$bodyHtml = (string) $converter->convert($md);

// Titre = première ligne "# ..."
$title = 'Document';
if (preg_match('/^#\s+(.+)$/m', $md, $m)) {
    $title = trim($m[1]);
}

$css = <<<CSS
@page { margin: 20mm 15mm; }
* { box-sizing: border-box; }
body {
    font-family: DejaVu Sans, sans-serif;
    font-size: 10pt;
    line-height: 1.5;
    color: #18181B;
}
h1 {
    font-size: 22pt;
    color: #FF2D20;
    border-bottom: 2px solid #FF2D20;
    padding-bottom: 6px;
    margin-top: 0;
}
h2 {
    font-size: 15pt;
    color: #18181B;
    border-bottom: 1px solid #E4E4E7;
    padding-bottom: 4px;
    margin-top: 18pt;
}
h3 { font-size: 12pt; color: #18181B; margin-top: 14pt; }
h4 { font-size: 11pt; color: #3F3F46; margin-top: 12pt; }
p  { margin: 6pt 0; }
a  { color: #FF2D20; text-decoration: none; }
code {
    background: #F4F4F5;
    padding: 1px 5px;
    border-radius: 3px;
    font-family: DejaVu Sans Mono, monospace;
    font-size: 9pt;
    color: #C026D3;
}
pre {
    background: #18181B;
    color: #F4F4F5;
    padding: 10px 12px;
    border-radius: 6px;
    font-family: DejaVu Sans Mono, monospace;
    font-size: 8.5pt;
    line-height: 1.4;
    white-space: pre-wrap;
    word-wrap: break-word;
    page-break-inside: avoid;
}
pre code { background: transparent; padding: 0; color: inherit; }
table {
    width: 100%;
    border-collapse: collapse;
    margin: 10pt 0;
    font-size: 9pt;
    page-break-inside: avoid;
}
th, td {
    border: 1px solid #D4D4D8;
    padding: 6px 8px;
    text-align: left;
    vertical-align: top;
}
th {
    background: #FFF1F0;
    color: #FF2D20;
    font-weight: 600;
}
tr:nth-child(even) td { background: #FAFAFA; }
blockquote {
    border-left: 3px solid #FF2D20;
    background: #FFF1F0;
    margin: 10pt 0;
    padding: 6pt 12pt;
    color: #52525B;
}
ul, ol { margin: 6pt 0; padding-left: 22px; }
li { margin: 2pt 0; }
hr {
    border: none;
    border-top: 1px solid #E4E4E7;
    margin: 14pt 0;
}
strong { color: #18181B; }
CSS;

$html = <<<HTML
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>$title</title>
<style>$css</style>
</head>
<body>
$bodyHtml
</body>
</html>
HTML;

// DomPDF
$options = new Options();
$options->set('isRemoteEnabled', false);
$options->set('isHtml5ParserEnabled', true);
$options->set('defaultFont', 'DejaVu Sans');

$dompdf = new Dompdf($options);
$dompdf->loadHtml($html, 'UTF-8');
$dompdf->setPaper('A4', 'portrait');
$dompdf->render();

// Pied de page avec numéros de pages
$canvas = $dompdf->getCanvas();
$canvas->page_text(
    520, 820,
    "Page {PAGE_NUM} / {PAGE_COUNT}",
    null,
    9,
    [0.5, 0.5, 0.5]
);

file_put_contents($output, $dompdf->output());

echo "✅ PDF généré : $output\n";
echo "   Taille : " . number_format(filesize($output) / 1024, 1) . " Ko\n";
