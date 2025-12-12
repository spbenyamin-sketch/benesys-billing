Set dele on
Set curs oFF
Set cons off
Set safe off
Set alte to TEMP\WBAR.PRN
Set alte on
Set safe on

Sele BARC

Go Top
Do While !eof()

?"I8,A"
?"q800"
?"O"
?"OD,S"
?"JF"
?"ZT"
?"Q280,16"
?"N"


PDT1=SPAC(10)
pd=RIGHT(ALLT(STR(YEAR(DATE))),2)+dtconv(ALLT(STR(MONTH(DATE))))+dtconv(ALLT(STR(DAY(DATE))))
for ix=1 to len(pd)
	pdt1=ALLT(pdt1)+finds(subs(pd,ix,1))
endf

?'b674,83,Q,m2,s3,eL,'+'"'+ALLTRIM(STR(SERIAL))+'"'
?'A747,224,2,2,2,2,N,'+'"'+ALLTRIM(ITNAME)+'"'

IF MRP#0
	?'A484,164,2,1,2,2,N,'+'"'+ALLTRIM(STR(RRATE))+'"'
	?'A484,122,2,1,2,2,N,"MRP"'
	IF LEN(ALLTRIM(STR(MRP)))<=3
		?'A499,90,2,1,3,3,N,'+'"'+ALLTRIM(STR(MRP))+'"'
	ELSE
		?'A490,80,2,1,2,2,N,'+'"'+ALLTRIM(STR(MRP))+'"'
	ENDIF 
ELSE
	IF LEN(ALLTRIM(STR(RRATE)))<=3
		?'A499,90,2,1,3,3,N,'+'"'+ALLTRIM(STR(RRATE))+'"'
	ELSE
		?'A490,80,2,1,2,2,N,'+'"'+ALLTRIM(STR(RRATE))+'"'
	ENDI 
ENDIF 
?'A743,177,2,2,1,1,N,'+'"'+ALLTRIM(BRANDNAME)+' '+ALLTRIM(NAME)+'"'
?'A660,110,2,2,1,1,N,'+'"'+ALLTRIM(PD)+'"'
?'A665,140,2,2,1,1,N,'+'"'++ALLTRIM(STR(SERIAL))+'"'
?'A558,82,2,1,2,2,N,"Rs."'
?'A719,59,2,1,1,1,N,'+'"'+ALLTRIM(SNAME)+'"'
SELE BARC
if !eof()
	skip
endi
if eof()
	exit
endi

********
PDT1=SPAC(10)
pd=RIGHT(ALLT(STR(YEAR(DATE))),2)+dtconv(ALLT(STR(MONTH(DATE))))+dtconv(ALLT(STR(DAY(DATE))))
for ix=1 to len(pd)
	pdt1=ALLT(pdt1)+finds(subs(pd,ix,1))
endf
SELECT BARC 

?'b290,83,Q,m2,s3,eL,'+'"'+ALLTRIM(STR(SERIAL))+'"'
?'A363,224,2,2,2,2,N,'+'"'+ALLTRIM(ITNAME)+'"'
IF MRP#0
	?'A100,164,2,1,2,2,N,'+'"'+ALLTRIM(STR(RRATE))+'"'
	?'A100,122,2,1,2,2,N,"MRP"'
	IF LEN(ALLTRIM(STR(MRP)))<=3
		?'A115,90,2,1,3,3,N,'+'"'+ALLTRIM(STR(MRP))+'"'
	ELSE
		?'A110,80,2,1,2,2,N,'+'"'+ALLTRIM(STR(MRP))+'"'
	ENDIF 
ELSE
	IF LEN(ALLTRIM(STR(RRATE)))<=3
		?'A115,90,2,1,3,3,N,'+'"'+ALLTRIM(STR(RRATE))+'"'
	ELSE
		?'A110,80,2,1,2,2,N,'+'"'+ALLTRIM(STR(RRATE))+'"'
	ENDIF 
ENDIF 

?'A359,177,2,2,1,1,N,'+'"'+ALLTRIM(BRANDNAME)+' '+ALLTRIM(NAME)+'"'
?'A276,110,2,2,1,1,N,'+'"'+ALLTRIM(PD)+'"'
?'A281,140,2,2,1,1,N,'+'"'++ALLTRIM(STR(SERIAL))+'"'
?'A174,82,2,1,2,2,N,"Rs."'

?'A335,59,2,1,1,1,N,'+'"'+ALLTRIM(SNAME)+'"'

?"P1"

SELE BARC
if !eof()
	skip
endi
if eof()
	exit
endi
ENDD

SELECT BARC
count to x
if x/2#0
	?"P1"
ENDI

set curs on
set cons on
set alte off
set alte to
sele barc
COUNT TO XXX
USE 
MESSAGEBOX(ALLTRIM(STR(XXX))+"  STICKER GENERATED",0,"STORE")
retu





proc dtconv
para d
	do case
		case len(d)=1	
			retu '0'+d
		case len(d)=2	
			retu d
	endc
retu	


FUNC FINDS
PARA XX
DO CASE
	CASE XX="1"
		YY="J"
	CASE XX="2"
		YY="A"
	CASE XX="3"
		YY="M"
	CASE XX="4"
		YY="E"
	CASE XX="5"
		YY="S"
	CASE XX="6"
		YY="B"
	CASE XX="7"
		YY="O"
	CASE XX="8"
		YY="N"
	CASE XX="9"
		YY="D"
	CASE XX="0"
		YY="X"
	CASE XX="."
		YY="."
	CASE XX=""
		YY="*"
ENDC
RETU YY
