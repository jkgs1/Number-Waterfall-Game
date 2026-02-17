import json
import os
import time

import cv2
import numpy as np
import socketio

# =============================
# CONFIGURATION
# =============================

USE_WEBCAM = False        # Set False to use image instead
IMAGE_PATH = os.path.abspath("wizard-of-oz\debug.png")  # Used if USE_WEBCAM = False
SOCKET_SERVER = "http://localhost:5000"

# SocketIO

sio = socketio.Client()

@sio.event
def connect():
    print("Connected to server!")
    sio.emit("join", "cv")

@sio.event
def disconnect():
    print("Disconnected from server!")

@sio.event
def connect_error(data):
    print("Connection failed:", data)

@sio.on("click")
def onclick(data):
    print(data)

    
sio.connect(SOCKET_SERVER, transports=["websocket"])


# =============================
# Placeholder for your logic
# =============================

def click_on_screen(percent_x, percent_y):
    print(f"Click at normalized position: ({percent_x:.3f}, {percent_y:.3f})")

    data = {
        "x": float(percent_x), 
        "y": float(percent_y),
        "timestamp": round(time.time() * 1000)
    }

    sio.emit("click", data)

    # Example conversion if you later want real pixels:
    # real_x = percent_x * SCREEN_WIDTH
    # real_y = percent_y * SCREEN_HEIGHT



# =============================
# Calibration + Click Handling
# =============================

calibration_points = []
transform_matrix = None
calibrated = False


def mouse_callback(event, x, y, flags, param):
    global calibration_points, transform_matrix, calibrated

    if event == cv2.EVENT_LBUTTONDOWN:

        # Step 1: Collect 4 corner points
        if not calibrated:
            calibration_points.append([x, y])
            print(f"Calibration point {len(calibration_points)}: ({x}, {y})")

            if len(calibration_points) == 4:
                compute_homography()
                calibrated = True
                print("Calibration complete!")

        # Step 2: After calibration → translate clicks
        else:
            pt = np.array([[[x, y]]], dtype=np.float32)
            mapped = cv2.perspectiveTransform(pt, transform_matrix)
            percent_x, percent_y = mapped[0][0]

            if 0.0 <= percent_x <= 1.0 and 0.0 <= percent_y <= 1.0:
                click_on_screen(percent_x, percent_y)



def compute_homography():
    global calibration_points, transform_matrix

    src_pts = np.array(calibration_points, dtype=np.float32)

    # Destination = normalized space (percent space)
    dst_pts = np.array([
        [0.0, 0.0],
        [1.0, 0.0],
        [1.0, 1.0],
        [0.0, 1.0]
    ], dtype=np.float32)

    transform_matrix = cv2.getPerspectiveTransform(src_pts, dst_pts)



# =============================
# Main Loop
# =============================

def main():

    if USE_WEBCAM:
        cap = cv2.VideoCapture(0)
    else:
        img = cv2.imread(IMAGE_PATH)

    cv2.namedWindow("Projection")
    cv2.setMouseCallback("Projection", mouse_callback)

    while True:

        if USE_WEBCAM:
            ret, frame = cap.read()
            if not ret:
                break
        else:
            frame = img.copy()

        # Draw calibration points
        for pt in calibration_points:
            cv2.circle(frame, tuple(pt), 8, (0, 0, 255), -1)

        # Draw outline once calibrated
        if calibrated:
            pts = np.array(calibration_points, np.int32)
            cv2.polylines(frame, [pts], True, (0, 255, 0), 2)

        cv2.imshow("Projection", frame)

        key = cv2.waitKey(1)

        if key == 27:  # ESC to exit
            break

        if key == ord('r'):  # Reset calibration
            reset_calibration()

        if not USE_WEBCAM:
            cv2.waitKey(0)
            break

    if USE_WEBCAM:
        cap.release()

    cv2.destroyAllWindows()
    sio.disconnect()


def reset_calibration():
    global calibration_points, calibrated
    calibration_points = []
    calibrated = False
    print("Calibration reset")


if __name__ == "__main__":
    main()
