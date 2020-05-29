#!/bin/bash
# * 1 * * * /home/olmozavala/Desktop/WORKWEB/sync_dropbox.sh
#rsync -r --info=progress2 --exclude={"*Web_Visualizer/node_modules", "Web_Visualizer/.idea", "Web_Visualizer/build"} /home/olmozavala/Desktop/REMOTE_PROJECTS/Web_Visualizer /home/olmozavala/Dropbox/MyProjects/COAPS/UN_Ocean_Litter/
rsync -r --info=progress2 --exclude-from='exclude.txt' /home/olmozavala/Desktop/REMOTE_PROJECTS/Web_Visualizer /home/olmozavala/Dropbox/MyProjects/COAPS/UN_Ocean_Litter/
echo "Check again, the latest version should be on dropbox"
