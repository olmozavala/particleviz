"""OZ example.

Usage:
  ParticleViz.py
  ParticleViz.py --config <config_file>
  ParticleViz.py (-h | --help)
  ParticleViz.py --version

Options:
  -h --help     Show this screen.
  --version     Show version.
  <config_file>     The file name
                [default: Config.json]
"""
from ParticleViz_DataPreproc import PreprocParticleViz
from docopt import docopt

if __name__ == '__main__':
    args = docopt(__doc__, version='ParticleViz 0.0.1')
    config_file = args['<config_file>']

    if config_file == "Config.json": # In this case they are using the default configuration
