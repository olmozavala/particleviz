import csv, json
from geojson import Feature, FeatureCollection, Point
import geopandas as gpd
import pandas as pd
import matplotlib.pyplot as plt

features = []
# file_name = "/home/olmozavala/Dropbox/MyProjects/EOAS/COAPS/Particle_viz/ParticleViz_WebApp/src/data/MarineFinfishMedSeaFarmsInfo.csv"
file_name = "/home/olmozavala/Dropbox/MyProjects/EOAS/COAPS/Blue-Code_Hack/Data/BlueCloudHackathon/ShellFishMedSeaFarmsInfo.csv"

# df = pd.read_csv(file_name, header=0, usecols=[2,3,4, 10])
df = pd.read_csv(file_name, header=0, usecols=[2, 4, 5])
# gdf = gpd.GeoDataFrame(df.loc[:,['COUNTRY','PRODUCTION_METHOD']], geometry=gpd.points_from_xy(df.LONGITUDE, df.LATITUDE))
gdf = gpd.GeoDataFrame(df.loc[:,['COUNTRY']], geometry=gpd.points_from_xy(df.LONGITUDE, df.LATITUDE))
gdf.crs = 'epsg:4326'

gdf.plot()
plt.show()

# gdf.to_file("geodata.geojson", driver="GeoJSON")
gdf.to_file("shellfish.geojson", driver="GeoJSON")
