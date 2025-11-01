#!/usr/bin/env python3
"""
シンプルなアイコン画像を生成するスクリプト
Pillowライブラリが必要です: pip install Pillow
"""

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("Pillowライブラリが必要です。以下のコマンドでインストールしてください:")
    print("pip install Pillow")
    exit(1)

def create_icon(size):
    """指定されたサイズのアイコンを作成"""
    # グラデーション背景
    img = Image.new('RGB', (size, size), color=(102, 126, 234))
    draw = ImageDraw.Draw(img)
    
    # グラデーション効果（簡易版）
    for i in range(size):
        r = int(102 + (118 - 102) * i / size)
        g = int(126 + (75 - 126) * i / size)
        b = int(234 + (162 - 234) * i / size)
        draw.rectangle([(0, i), (size, i+1)], fill=(r, g, b))
    
    # 中央に「LLM」テキスト
    try:
        font_size = max(12, size // 3)
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
    except:
        try:
            font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", font_size)
        except:
            font = ImageFont.load_default()
    
    text = "LLM"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    position = ((size - text_width) // 2, (size - text_height) // 2)
    draw.text(position, text, fill=(255, 255, 255), font=font)
    
    return img

if __name__ == "__main__":
    sizes = [16, 48, 128]
    for size in sizes:
        icon = create_icon(size)
        filename = f"icon{size}.png"
        icon.save(filename)
        print(f"Created {filename} ({size}x{size})")
    
    print("\nアイコンの生成が完了しました！")