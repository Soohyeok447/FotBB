const mongoose = require("mongoose");

module.exports = () => {
    //connect 함수
    const connect = () => {
        if (process.env.NODE_ENV !== "production") {
            mongoose.set("debug", true);
        }

        mongoose.connect(
            "mongodb://soohyeok:asd123@localhost:27017/admin",
            {
                dbName: "FotBB-DB",
            },
            (error) => {
                //마지막 인자(error) -> 연결 여부 확인
                if (error) {
                    console.log("FotBB connect error", error);
                } else {
                    console.log("FotBB DB API Server connected");
                }
            }
        );
    };

    //mongoDB와 노드 연결
    connect();
    //몽구스 커넥션에 이벤트 리스너를 담, 에러 발생시 에러 내용 기록 및 연결 종료 시 재연결시도
    mongoose.connection.on("error", (error) => {
        console.error("connection error", error);
    });
    mongoose.connection.on("disconnected", () => {
        console.error("disconnected. try connect to FotBB");
    });

    //스키마 연결부
    require("./stage");
    require("./leaderboard");
    require("./user_stage");
    require("./user");
};
