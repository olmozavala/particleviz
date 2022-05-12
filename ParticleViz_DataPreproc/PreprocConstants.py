from enum import Enum

class ModelType(Enum):
    """ Enum for each file format that ParticleViz nows how to read """
    OCEAN_PARCELS = 1
    OPEN_DRIFT = 2