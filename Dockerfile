FROM mambaorg/micromamba

USER $MAMBA_USER
COPY --chown=$MAMBA_USER:$MAMBA_USER particleviz.yml /tmp/env.yaml
RUN micromamba create --yes --name particleviz -f /tmp/env.yaml && \
    micromamba clean --all --yes

COPY --chown=$MAMBA_USER ParticleViz_WebApp /home/$MAMBA_USER/app/ParticleViz_WebApp
COPY ParticleViz_DataPreproc /home/$MAMBA_USER/app/ParticleViz_DataPreproc
COPY ExampleData /home/$MAMBA_USER/app/ExampleData
COPY ConfigExamples /home/$MAMBA_USER/app/ConfigExamples
COPY --chmod=0755 entrypoint.sh /home/$MAMBA_USER/app/
COPY ParticleViz.py /home/$MAMBA_USER/app/

WORKDIR /home/$MAMBA_USER/app/
ARG MAMBA_DOCKERFILE_ACTIVATE=1
RUN eval "$(micromamba shell hook --shell=bash)" &&\
    micromamba activate particleviz &&\
    cd ParticleViz_WebApp && npm install

EXPOSE 3000

# if no entrypoint is specified, the default is to run the command from arguments

# for micromamba image, there is a default entrypoint
# take activate the environment so python is available
#ENTRYPOINT ["/usr/local/bin/_entrypoint.sh"]  # default of micromamba image
# or using CMD will append the arguments to the entrypoint
CMD ["./entrypoint.sh"]
