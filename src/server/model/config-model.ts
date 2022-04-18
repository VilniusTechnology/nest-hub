export class LedServerConfig {
    public driver_type: string;
    public driver: LedServerDriver;
    public contours: LedServerContourObj;
}

class LedServerDriver {
    public i2c: any;
    public address: any;
    public frequency: number;
    public debug: boolean;
}

class LedServerContours {
    public contours: LedServerContourObj;
}

class LedServerContourObj {
    public main: LedServerContourData;
}

class LedServerContourData {
    public red: number;
    public green: number;
    public blue: number;
    public coldWhite: number;
    public warmWhite: number;
}

