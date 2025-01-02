import os

# Absolute directory to save the files
directory = "C:/Users/PatrickSchwendemann/Documents/Git Private/dnd-portal-frontend/public/story/fight/"

# Create directory if it doesn't exist
os.makedirs(directory, exist_ok=True)

# Create 25 .md files named 1_room.md to 25_room.md
filenames = []
for i in range(1, 26):
    filename = os.path.join(directory, f"room_{i:02}.md")
    with open(filename, "w") as file:
        # Write the heading into the file
        file.write(f"# Raum_{i}\n")
        file.write(f"\n")
        file.write(f"## Kampf\n")
        file.write(f"\n")
        file.write(f"![Monstercards](../../../public/story/fight/assets/room_{i}.png)\n")
    filenames.append(filename)

print(f"Created files: {filenames}")
