import math

smoothness = 45
dangle = smoothness * math.pi / 180
r1 = 1.0 #major radius
r2 = 0.5 #minor radius

torus_file = open("torus_smooth.obj", "w")
num = int(2*math.pi / dangle)
count = 0

vertices = []
faces = []

for i in range(0, num):  #longitude
    for j in range(0, num): #latitude
        p = float(i) * dangle
        t = float(j) * dangle

        #lower left
        xPos1 = (r1 + r2 * math.cos(t)) * math.cos(p)
        yPos1 = (r1 + r2 * math.cos(t)) * math.sin(p)
        zPos1 = r2 * math.sin(t)

        #upper left
        xPos2 = (r1 + r2 * math.cos(t+dangle)) * math.cos(p)
        yPos2 = (r1 + r2 * math.cos(t+dangle)) * math.sin(p)
        zPos2 = r2* math.sin(t+dangle)

        #upper right
        xPos3 = (r1 + r2 * math.cos(t+dangle)) * math.cos(p+dangle)
        yPos3 = (r1 + r2 * math.cos(t+dangle)) * math.sin(p+dangle)
        zPos3 =  r2 * math.sin(t+dangle)

        #lower right
        xPos4 = (r1 + r2 * math.cos(t)) * math.cos(p+dangle)
        yPos4 = (r1 + r2 * math.cos(t)) * math.sin(p+dangle)
        zPos4 = r2 * math.sin(t)

        v1 = [xPos1,yPos1,zPos1]
        #v2 = [xPos2,yPos2,zPos2]
        #v3 = [xPos3,yPos3,zPos3]
        #v4 = [xPos4,yPos4,zPos4]

        count += 1
        print(i)
        print(j)
        print(count)
        print(v1)
        vertices.append(v1)


        bl = (num * i) + j + 1
        tl =  ( ((num * i ) + num) % (num * num) ) + j + 1
        br = (num * i) + ((j + 1) % num) + 1
        tr = ( ((num * i ) + num) % (num * num) ) + ((j + 1) % num) + 1

        f1 = [bl, tl, tr]
        f2 = [bl, tr, br]

        faces.append(f1)
        faces.append(f2)

"""
        if(i == num-1):
            count += 1;
            print(count)
            print(v2)
            vertices.append(v2)

        if(j == num-1 and i == num-1):
            count += 1;
            print(count)
            print(v3)
            vertices.append(v3)

        if(j == num-1):
            count += 1;
            print(count)
            print(v4)
            vertices.append(v4)
"""

for v in vertices:
    s = "v " + str(v[0]) + " " + str(v[1]) + " " + str(v[2]) + "\n"
    torus_file.write(s)
    print(s)

for f in faces:
    s = "f " + str(f[0]) + " " + str(f[1]) + " " + str(f[2]) + "\n"
    torus_file.write(s)
    print(s)
