# Teras

## Git branch naming convention

 master<br>
└─develop<br>
    ├─backend<br>
    │  ├─feature/be-login<br>
    │  ├─feature/be-signup<br>
    │  ├─classroom<br>
    ├─frontend<br>
    │  ├─feature/fe-login<br>
    │  └─feature/fe-signup<br>


## Git merge request naming convention

title : ex) [FE] merge feature/fe-login into frontend

* "Delete source branch when merge request is accepted" 항목 체크 시 merge시킨 원래 브런치 삭제됨

    더 이상 필요없는 브랜치일 경우만 체크!

## Git commit naming convention

[FE/BE] (구현한 기능) (동사)

ex) [BE] login api add / [FE] signup page css update

## AWS 진행 사항

### 기본 설정
방화벽 설정(ssh 허용, 방화성 활성화)
* sudo ufw allow ssh
* sudo ufw enable

***

### nginx
nginx 설치
* sudo apt-get install nginx

nginx 설정
* sudo vi /etc/nginx/sites-available/default

nginx 명령어
* 재부팅    : sudo service nginx reload
* 중지      : sudo systemctl stop nginx
* 시작      : sudo systemctl start nginx
* 재시작    : sudo systemctl restart nginx
* 비활성화  : sudo systemctl disable nginx
* 활성화    : sudo systemctl enable nginx

***

### mysql

mysql-server 설치
* sudo apt-get install mysql-server

방화벽 설정(mysql 허용)
* sudo ufw allow mysql
