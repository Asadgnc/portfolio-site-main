$galleryHTML = Get-Content "pages\gallery\gallery-tr.html" -Raw -Encoding UTF8
$pattern = '(?s)(<a href="../../gallery-items/item-\d+/gallery-item-\d+-tr\.html".*?</a>)'
$matches = [regex]::Matches($galleryHTML, $pattern)
$cards = $matches | ForEach-Object { 
    $_.Value -replace 'href="../../gallery-items/', 'href="gallery-items/' -replace 'src="../../images/', 'src="images/'
}
$cardsHTML = "                    " + ($cards -join "`n                    ")
$homeHTML = Get-Content "tr.html" -Raw -Encoding UTF8
$newHTML = $homeHTML -replace '(?s)(<div class="projects-preview-grid.*?id="projects-preview-grid">).*?(</div>\s*</div>\s*</section>)', "`$1`n$cardsHTML`n                </div>`n            </div>`n        </section>"
$newHTML | Set-Content "tr.html" -Encoding UTF8
Write-Host "TR gallery cards updated!" -ForegroundColor Green
