import os
import urllib.request

assets = [
    # Screen 1
    ("https://lh3.googleusercontent.com/aida/AP1WRLteFGeAXZG4_iaombCQCINKo7-TkTBTYZTyLbd6-KGxrJu9SnA8nZ_uT8VVhlNJ6arU9vONgqY_zpwT3EcwFTJWHaKLoDIMfWbR6SF9MwDTKEEYji1gA302P8kEiNkBxsco5aZf4fXtmFHw0PQfYkvSF3YFUBTJ-XVlh5bcT_v07A1f3qtQO51b0URv0z-psgVQJx8sgwyHdhG98XJLH7MPlbt9lyRHmX_pl7ws6jNX6_j_GtNIFeFEc9uRrku9-0JO7TwQk2nQkw", "screen_1_image.png"),
    # Screen 2
    ("https://lh3.googleusercontent.com/aida/AP1WRLsqOfjJf3TFArUVCDlI0v--zfZjBXRd9N1EdZAL4uDbFE4G-JQ9mj2gaWjUY42O82hPJgraebrU-tgnF17e0QhE1tECTX8pP0cU7mSGIZ8EE3_7dr3N17VOovU3a2dmilaaqtgjUD58qabXVyUZ3vvzV9Q3OvJkXY4tg_RXswzQzbSyu8RLykjn8N8n37uGfYPAFqwQpgyrb3tQ6cfZAKVQsI_ixzorKXuOvt-r69NW1OFNybrVJ8NN3gL-5V4iWtMm2ZOJmXtSWA", "screen_2_image.png"),
    # Screen 3
    ("https://lh3.googleusercontent.com/aida/AP1WRLsL7sf9FwAhRQ6dnvgaSd-AEYXI_Ub1vXXUGMVOtuW2IChkQiIqwx4DokxTvY_cH9-RyAw2uhOP9yhRu8VkrLngkI2zowCfBmkXlr-s1xZuKbXg5kqSenYpKD-b6WD_SW1-md9foCDgRbdIveHrLLMBdFVTraZ5mUha1i78PV7Yx1QhNvhZtTl0xZtt0VT79-x8zJnGY0h5Wk6sD_n4o6w-vshwdSN1wEFqUTn_M4AfAJZ1o4XnplQ9AyGZ9QKA_ON0KX8o5l2Omg", "screen_3_image.png"),
    # Screen 4
    ("https://lh3.googleusercontent.com/aida/AP1WRLtGn4GVW1GKs9NoyYGTGQjp0UwU0K08UE5Hf0QK1ayZYPXVCYvZ5lDYpOJkDF_MAW5gPc1icNQLH_aSCjucCuvyL09dZ9WngyveLzACRW8hbk9zQvihcfVNZJs7ryxCzLrKV_WdkVri28EiC0IAXW6WVdHPsxLoLzT6xDrhpc3svZk1Gr4egA0f1Hr5TFb47RswUG4ZuuT4yfMe8WmRO28h9eiX5xMYDthak8kW1a5gxVsDiwf8H-90v-7LoZM8mutNQjB1uhXfhA", "screen_4_image.png"),
    # Screen 5 (Markdown)
    ("https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sX2YwOTYxMzZlN2ViNTRiNmU4OGNkNWNiODIyMDQxN2FlEgsSBxDDt4W0thIYAZIBIwoKcHJvamVjdF9pZBIVQhMzNzExNTgwMTMwMjE2NTM5Nzg2&filename=&opi=89354086", "github_extracted_text.md"),
    # Screen 7 (Game Table)
    ("https://lh3.googleusercontent.com/aida/AP1WRLshD6s80SkI8TWpFiDzcYJriQX-emzm3y3l4l7j04-h3auMSXVQsVkJo0sQOfRdNfsa1yLxSVt2H866hITa-umTLRikdwyCFim99XGfT0E5BkFmRfyffjnECX4imW87bhIwAhp5z2gTDChIwUeKsOD5Lrd33tQNBbOCKt3atRmZntmu_FIcxJwwzqnMkNr8JJ2cpdCvOkt87QijFcNwXQpAWmkFvOeb2fJeULIeKb2QicJfDAXHPUhIMg", "game_table_screenshot.png"),
    ("https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sX2RmNGNiYzRmMTcyZTQwY2ViZmFiZWRmOGE3NDllODJjEgsSBxDDt4W0thIYAZIBIwoKcHJvamVjdF9pZBIVQhMzNzExNTgwMTMwMjE2NTM5Nzg2&filename=&opi=89354086", "game_table.html"),
    # Screen 8 (Round Settlement)
    ("https://lh3.googleusercontent.com/aida/AP1WRLt7jil_kA1XiI0jjN74uKYhAqE0YJ6MT-uyUUhjCOGTY2CHDsJOYU2hWbBv6cCtIqcBq_-LsZ1XxeSy0N6Oo5HOmw0UVxrdEHLtdnzEDJpGBHh8M3whe_X57N3uTIUC2gdbZae1wJEFHcZ2AsboQsHU5oa9gjl2i-PoYRkWhFDaOljd8kFm1STkK10RBRP6liOtKkr_9Hb_NbrZl5PIi5DOcmpk3SCp3f3J7Vvmc_3OJ9bAFZSXBXA3MYs", "round_settlement_screenshot.png"),
    ("https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sX2MzN2E0Y2JkYzBkNzQ3YjRhY2IxYmExMGVlYzYxODljEgsSBxDDt4W0thIYAZIBIwoKcHJvamVjdF9pZBIVQhMzNzExNTgwMTMwMjE2NTM5Nzg2&filename=&opi=89354086", "round_settlement.html"),
    # Screen 9 (Game Lobby)
    ("https://lh3.googleusercontent.com/aida/AP1WRLtXXlaQ3vzh1ribS0lxSvuq9WeoW_nNIk0FrWvNDdmwt0Vudq8FhFT2NDHxVBDktmh0Uemwi0GbQiaiDp0Z-XcntyJYa7we51WRpGb48lSmCgemHDJdlVtlya27LkQfIFJ0g5v9KaeYry_4y6EKuP_ycTYLOI4WNu2bo1TSab2FrArhJpWwjD0IHqUP27nT1lMPJmHeDs45q9Gkgn1pFWKvaTIXFeiCPbwoJ0nqEbC__Kivbk51-zkeVg", "game_lobby_screenshot.png"),
    ("https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ7Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpaCiVodG1sXzlhMzk4MTQ5MGJjMDQ2MTQ5MmM2YTkzYmFiYmQ2ZDZjEgsSBxDDt4W0thIYAZIBIwoKcHJvamVjdF9pZBIVQhMzNzExNTgwMTMwMjE2NTM5Nzg2&filename=&opi=89354086", "game_lobby.html"),
]

out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "stitch-assets")
os.makedirs(out_dir, exist_ok=True)

print(f"Downloading assets to {out_dir}...")
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
}

for url, filename in assets:
    dest = os.path.join(out_dir, filename)
    print(f"Downloading {filename}...")
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as response:
            with open(dest, 'wb') as out_file:
                out_file.write(response.read())
        print(f"Successfully downloaded {filename}")
    except Exception as e:
        print(f"Failed to download {filename}: {e}")

print("Done!")
