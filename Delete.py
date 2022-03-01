#Author: Dylan Murphy
#Author: Dylan Murphy
#Date: 2/23/2022
#Script for processing Copernicus netCDF data

#%%Import libraries
import xarray as xr
import matplotlib.pyplot as plt
import cartopy.crs as ccrs
import cartopy.feature as cf
import numpy as np
import cv2 as cv
import time

##
start_time = time.time()

#%% Define Functions
def Crop_ds_to_Gulf(uncropped_ds):
    '''Crops an uncropped dataset, and returns a cropped dataset'''
    #From coast of Coatzacoalcos, Mexico
    min_lat= 18.151657

    # Coast of Biloxi, Mississippi
    max_lat= 30.39081

    #Near South Padre Island
    min_lon= -97.5

    #Near Miami, FL
    max_lon= -80.2

    #Create masks
    mask_lon = (uncropped_ds.longitude >= min_lon) & (uncropped_ds.longitude <= max_lon)
    mask_lat = (uncropped_ds.latitude >= min_lat) & (uncropped_ds.latitude <= max_lat)
    cropped= uncropped_ds.where(mask_lon & mask_lat, drop=True)
    return cropped


#%%Load Perimeter array, outside of the rest of the script.

#perimeter=np.array([])
size=15

perimeter= np.zeros(size)
#%%Load file and parameters

ds= xr.open_dataset('/home/olmozavala/Downloads/2018.nc')


#Define SSH and other non-loop constants
ssh= ds.adt - ds.adt.mean()
# ssh= ds.adt - ds.adt.mean(axis=0)
# ssh = ds.adt

##
'''Parameters that can be modified'''
#Define threshold for LC
#Epsilon was modified until a reasonable amount of the current
#was identified, without increasing error
# lc_epsilon= 0.0935
num_dilations=1

#Look for the Loop Current with a margin of error.

# for lc_th in np.linspace(0.04,0.09,10):
#     # lc_th= 0.17
#     lc_epsilon = 0.05
#     lc = np.logical_and(ssh>= lc_th-lc_epsilon, ssh<=lc_th+lc_epsilon)
#     # lc = ssh <= lc_th+lc_epsilon
#     fig, axs = plt.subplots(1,2,figsize=(8,4))
#     axs[0].imshow(ssh[10,::-1,:])
#     axs[1].imshow(lc[10,::-1,:])
#     plt.title(lc_th)
#     plt.show()

lc_th= 0.04
lc_epsilon = 0.05
lc = np.logical_and(ssh>= lc_th-lc_epsilon, ssh<=lc_th+lc_epsilon)
# lc = ssh <= lc_th+lc_epsilon
fig, axs = plt.subplots(1,2,figsize=(8,4))
axs[0].imshow(ssh[10,::-1,:])
axs[1].imshow(lc[10,::-1,:])
plt.title(lc_th)
plt.show()
##

#%% Run the loop over the file
for day in range(size):
    #Generating image
    plt.title("Sea Surface Height (m), Error = +/- 0.0935 m")
    plt.imshow(np.flip(lc[day,:,:],0))
    plt.savefig('Contour.jpg')
    plt.show()

    #Image Processing
    image= cv.imread('Contour.jpg')
    img_grey= cv.cvtColor(image, cv.COLOR_BGR2GRAY)

    #Thresholding
    ret, thresh= cv.threshold(img_grey, 150,255, cv.THRESH_BINARY)


    #Dilation
    kernel = np.ones((5,5), np.uint8)
    dilated_img= cv.dilate(thresh, kernel,iterations=num_dilations)



    #Image Correction, Border Drawing and Cropping
    rows, columns = dilated_img.shape
    #Top row is 0,j
    #Bottom row is rows-1,j
    #Left col is i,0
    #Right col is i, col-1
    #Draw across the top

    #Uninitialized representation of cropped indices
    start_row = start_col = end_row = end_col=-1
    for i in range(rows):
        for j in range(columns):

            temp= dilated_img[i][j]

            #If start col is not found yet, check for target at current location
            if(start_col==-1):
                #Target found if true, mark indices
                if(temp==0):
                    start_row=i
                    start_col=j
            #Now look for end values, these will self adjust as the loop progresses
            if(temp==0):
                if (i>end_row):
                    end_row=i
                if (j>end_col):
                    end_col=j

            if (i==0):
                dilated_img[i][j]=255
            if (i==rows-1):
                dilated_img[i][j]=255
            if (j==0):
                dilated_img[i][j]=255
            if (j==columns-1):
                dilated_img[i][j]=255


    cropped_dilated= dilated_img[start_row:end_row, start_col:end_col]

    #Contouring, Perimeter, and Appending
    contours, hierarchy = cv.findContours(image=cropped_dilated, mode=cv.RETR_EXTERNAL, method= cv.CHAIN_APPROX_NONE)



    #Go through the array and compute the arc length of each, and get the highest element as you do
    #Assume that the first one is the longest, and correct it over a loop
    longest= cv.arcLength(contours[0], True)

    for i in range(len(contours)):
        if (cv.arcLength(contours[i],True)>longest):
            longest = cv.arcLength(contours[i], True)

    #print('\nResults: The longest length is ', longest)
    #print('Appending Results...\n')

    # perimeter=np.append(perimeter,longest)
    #print('At t=',day,' ,the array is',perimeter)
    perimeter[day]=longest

print('All Done!, the final dataset is\n', perimeter)
print('\n')
print ("My program took", time.time() - start_time, "to run")

#%%Plotting data
plt.clf()
time= range(len(perimeter))
plt.title(f'Loop Current Perimeter, dilations = {num_dilations}')
plt.xlabel('Time (days)')
plt.ylabel('Perimeter (pixel count)')

plt.plot(time,perimeter)
