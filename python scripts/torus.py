import math

smoothness = 15
dangle = smoothness * math.pi / 180
r1 = 1.0 #major radius
r2 = 0.5 #minor radius

torus_file = open("torus_15.obj", "w")
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

        v1 = [xPos1,yPos1,zPos1]

        count += 1
        vertices.append(v1)

        bl = (num * i) + j + 1
        tl =  ( ((num * i ) + num) % (num * num) ) + j + 1
        br = (num * i) + ((j + 1) % num) + 1
        tr = ( ((num * i ) + num) % (num * num) ) + ((j + 1) % num) + 1

        f1 = [bl, tl, tr]
        f2 = [bl, tr, br]

        faces.append(f1)
        faces.append(f2)

for v in vertices:
    s = "v " + str(v[0]) + " " + str(v[1]) + " " + str(v[2]) + "\n"
    torus_file.write(s)
    print(s)

for f in faces:
    s = "f " + str(f[0]) + " " + str(f[1]) + " " + str(f[2]) + "\n"
    torus_file.write(s)
    print(s)
