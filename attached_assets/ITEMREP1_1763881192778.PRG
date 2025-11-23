IF USED("PARTY")
	SELECT PARTY
	USE
ENDI 
IF USED("SALMAS")
	SELECT SALMAS
	USE
ENDI 
IF USED("MAINSALE")
	SELECT MAINSALE
	USE
ENDI 
IF USED("SALE")
	SELECT SALE
	USE
ENDI 

IF !USED("PARTY")
	SELECT 0
	USE PARTY
ENDI 

IF !USED("SALMAS")
	SELECT 0
	USE SALMAS
ENDI 

IF !USED("MAINSALE")
	SELECT 0
	USE DATA\MAINSALE
ENDI 

IF !USED("SALE")
	SELECT 0
	USE DATA\SALE
ENDI 

Local oForm
oForm = CREATEOBJECT("TopForm1")
oForm.show()
_screen.Visible = .F. && Hide Screen

SET CONFIRM ON 
prn=0
sl=0
pg=0
dw=chr(27)+chr(87)+chr(1)
dwc=chr(27)+chr(87)+chr(0)
dh=chr(27)+chr(119)+chr(1)
dhc=chr(27)+chr(119)+chr(128)
ep=chr(27)+chr(69)
epc=chr(27)+chr(70)
ds=chr(27)+chr(71)
dsc=chr(27)+chr(72)
cp=chr(15)
cpc=chr(18)
lqc=chr(27)+chr(120)+chr(0)
lq=chr(27)+chr(120)+chr(1)
TINVNO=0
SELE SALE
SET ORDER TO DATE
TDT=DATE()
FDT=DATE()
TPCODE=0
TPNAME=SPAC(20)
TCITY=SPAC(20)
TTYPE='ITEM-ONLY'
TBILL1='ALL'
TAGENT=SPAC(30)
TAGE="ALL"
TCOMPANY=0
defi wind MYPRN3 from 6,20 to 12,59 shad colo w+/r+,w+/n+ NONE FONT 'Consolas',15 STYLE "B" IN WINDOW Form1
acti wind MYPRN3
@ 0,0 say padc("SALES REPORT ITEM WISE",46) colo w+/n+
@ 2,1 SAY "FROM :" GET FDT
@ 2,21 SAY "TO :" GET TDT
@ 4,2 GET TBILL1 PICT "@MK ALL,GST,EST"
*@ 4,1 SAY "AGENT :" GET TAGE PICT "@M ALL,AGN" 
*@ 4,14  GET TAGENT SIZE 1,25 VALI CHKAGENT() WHEN TAGE="AGN" PICT "@K"
*@ 6,1 SAY "PARTY  :" GET TPNAME  VALI CHKPARTY() PICT "@K"
@ 4,8 GET TTYPE PICT  "@M RATE-ITEM,ITEM-ONLY"
@ 4,18 GET prn PICTURE "@*hT \<Screen;\<Printer;\<Exit" 
read
if last()=27 or prn=3
	rele wind MYPRN3
	IF USED("PARTY")
		SELECT PARTY
		USE
	ENDI 
	IF USED("MAINSALE")
		SELECT MAINSALE
		USE
	ENDI 
	IF USED("SALE")
		SELECT SALE
		USE
	ENDI 
	IF USED("SALMAS")
		SELECT SALMAS
		USE
	ENDI 

	RETU
endif
set curs off
set cons off
do case
	case prn = 1
		set safe off
		set alte to out.txt
		set alte on
		set safe on
		defi wind crea from 8,25 to 13,55 doub shad colo sche 10 FONT 'Consolas',15 STYLE "B" 
		acti wind crea
		@ 1,8 say "Creating Report"
		@ 2,8 say "Please Wait ..." colo W*/w+
	case prn = 2
		defi wind crea from 8,25 to 13,55 doub shad colo sche 10 FONT 'Consolas',15 STYLE "B" 
		acti wind crea
		@ 1,8 say "Printing Report"
		@ 2,8 say "Please Wait ..." colo W*/w+
		set cons off
    	*set prin on
 	case prn = 3
   		set proc to
   		retu
	endc

stot=0

if prn=1
	store '' to cp,cpc,ep,epc,DW,DWC,LQ,LQC,dh,dhc,DS,DSC



else
	??chr(27)+chr(67)+chr(0)+chr(12)
endif
SET SAFE OFF
IF TBILL1#"ALL"	
	IF TBILL1="GST"
		TCOMPANY=1
	ELSE
		TCOMPANY=2
	ENDIF 
	IF ALLTRIM(TTYPE)="RATE-ITEM"
		SELECT FDT AS FDT,TDT AS TDT,DATE,INVNO,CODE1,RATE,IIF(TYPE="P",SUM(QTY),SUM(VAL(SIZE)*QTY)) AS QTY,IIF(TYPE="P",SUM(RATE*QTY),SUM(RATE*VAL(SIZE)*QTY)) AS AMOUNT,TPNAME AS PNAME FROM SALE WHERE DATE>=FDT AND DATE<=TDT AND COMPANY=TCOMPANY INTO CURS WST GROUP BY CODE1,RATE 
		SELECT A.*,B.GROOP,B.NAME FROM WST A,SALMAS B WHERE A.CODE1=B.CODE1 ORDER BY GROOP,NAME,RATE INTO TABLE WASTE 
	ELSE
		SELECT FDT AS FDT,TDT AS TDT,DATE,INVNO,CODE1,RATE,IIF(TYPE="P",SUM(QTY),SUM(VAL(SIZE)*QTY)) AS QTY,IIF(TYPE="P",SUM(RATE*QTY),SUM(RATE*VAL(SIZE)*QTY)) AS AMOUNT,TPNAME AS PNAME FROM SALE WHERE DATE>=FDT AND DATE<=TDT AND COMPANY=TCOMPANY INTO CURS WST GROUP BY CODE1
		SELECT A.*,B.GROOP,B.NAME FROM WST A,SALMAS B WHERE A.CODE1=B.CODE1 ORDER BY GROOP,NAME INTO TABLE WASTE 
	ENDIF 
ELSE
	IF ALLTRIM(TTYPE)="RATE-ITEM"
		SELECT FDT AS FDT,TDT AS TDT,DATE,INVNO,CODE1,RATE,IIF(TYPE="P",SUM(QTY),SUM(VAL(SIZE)*QTY)) AS QTY,IIF(TYPE="P",SUM(RATE*QTY),SUM(RATE*VAL(SIZE)*QTY)) AS AMOUNT,TPNAME AS PNAME FROM SALE WHERE DATE>=FDT AND DATE<=TDT INTO CURS WST GROUP BY CODE1,RATE 
		SELECT A.*,B.GROOP,B.NAME FROM WST A,SALMAS B WHERE A.CODE1=B.CODE1 ORDER BY GROOP,NAME,RATE INTO TABLE WASTE 
	ELSE
		SELECT FDT AS FDT,TDT AS TDT,DATE,INVNO,CODE1,RATE,IIF(TYPE="P",SUM(QTY),SUM(VAL(SIZE)*QTY)) AS QTY,IIF(TYPE="P",SUM(RATE*QTY),SUM(RATE*VAL(SIZE)*QTY)) AS AMOUNT,TPNAME AS PNAME FROM SALE WHERE DATE>=FDT AND DATE<=TDT INTO CURS WST GROUP BY CODE1
		SELECT A.*,B.GROOP,B.NAME FROM WST A,SALMAS B WHERE A.CODE1=B.CODE1 ORDER BY GROOP,NAME INTO TABLE WASTE 
	ENDIF 
ENDIF 
tot=0
TQ=0
SELE WASTE
go top
IF ALLTRIM(TTYPE)="RATE-ITEM"
	DO HED
	scan 
		?PADR(NAME,30)+" "+STR(RATE,8,2)+" "+STR(QTY,8,2)+' '+str(round(amOUNt,0),10,2)
		tot=tot+ROUND(amount,0)
		TQ=TQ+QTY
	ends
ENDIF
IF ALLTRIM(TTYPE)="ITEM-ONLY"
DO HED1
	scan 
		?PADR(NAME,30)+" "+STR(QTY,8,2)+' '+str(round(amOUNt,0),10,2)
		tot=tot+ROUND(amount,0)
		TQ=TQ+QTY
	ends
ENDI 
?repl("-",62)
?spac(35)+str(tQ,10,2)+"  "+str(tot,12,2)
?repl("=",62)
SELE WASTE
USE

rele wind crea
set curs on
set cons on
if prn  = 1
	set alte off
	set alte to
	modi file out.txt  IN WINDOW  Form1 NOEDIT 
else
	set print off
endi
set cons off
set prin off
set cons on
IF PRN=2
	IF ALLTRIM(TTYPE)="RATE-ITEM"
	   REPORT FORM ITEMREP1.frx  NOCONSOLE PREVIEW IN WINDOW Form1
	ELSE
	   REPORT FORM ITEMREP2.frx  NOCONSOLE PREVIEW IN WINDOW Form1
	ENDI
ENDI
RELEASE WINDOW MYPRN3

IF USED("PARTY")
	SELECT PARTY
	USE
ENDI 
IF USED("MAINSALE")
	SELECT MAINSALE
	USE
ENDI 
IF USED("SALE")
	SELECT SALE
	USE
ENDI 

RETU

READ EVENTS

_screen.Visible = .T. && Show Screen

DEFINE CLASS TopForm1 as Form

ShowWindow = 2
Windowstate=2
Name = "Form1"
Caption =  "Party Item Report"
FontName = 'Consolas'
FontSize = 17
icon = "star.ico"
BACKCOLOR=RGB(250,150,150)
PROCEDURE Destroy

CLEAR EVENTS

ENDPROC

ENDDEFINE








proc hed
pg=pg+1
?PADC("RATE - ITEM WISE SALES REPORT",50)
?"FROM :"+DTOC(FDT)+" TO :"+DTOC(TDT)
*?ALLT(TPNAME)+"-"+ALLT(TCITY)
?repl("-",50)

?PADC("ITEM NAME",25)+"  "+PADL("RATE",7)+"  "+PADL("QTY",8)+"  "+PADL("AMOUNT",8)
?repl("-",50)
retu


proc hed1
pg=pg+1
?PADC("ITEM WISE SALES REPORT",50)
?"FROM :"+DTOC(FDT)+" TO :"+DTOC(TDT)
*?ALLT(TPNAME)+"-"+ALLT(TCITY)
?repl("-",50)
?PADC("ITEM NAME ",25)+"  "+PADC("QTY",10)+"  "+PADC("AMOUNT",10)
?repl("-",50)
retu


proc pgbrk
sl=0
?repl("-",50)
if prn=2
	eject
endi
do hed
retu



PROC CHKNO
SELE SALE
SET ORDER TO INVNO
SEEK TINVNO
IF !FOUND()
	WAIT WIND "NO."+ALLT(STR(TINVNO))+" NOT FOUND" NOWA
	RETU 9
ENDI
RETU





PROCEDURE CHKPARTY
SELE PARTY
SET ORDER TO PNAME
SET FILTER TO 
SET CONFIRM ON 
IF TAGE#"ALL"
	SET FILT TO ALLT(AGENT)=ALLT(TAGENT)
ENDIF 
IF !EMPTY(TPNAME)
	SELECT PARTY
	SET FILTER TO 
	SET FILTER TO ALLTRIM(PNAME)=ALLTRIM(TPNAME)
ENDIF 
defi popu findx from 1,1 FONT 'Consolas',15 STYLE "B" colo g+/n+,g+/n+,g+/n+,GR+/N+;
title padc("Name",30) prom fiel padr(Pname,35)+"-"+padr(city,25)
on sele popu findx do selfindx
acti popu findx  
SELE PARTY
SET FILT TO
IF EMPT(TPNAME)
	WAIT WIND "PLEASE SELECT PARTY NAME" NOWA
ENDI 
sele PAYMENT
retu



proc selfindx
Tpname=party.pname
TAGENT=PARTY.AGENT
TPCODE=PARTY.PCODE
show gets
deac popu findx
RETURN


PROCEDURE CHKAGENT
SELECT PARTY 
SET FILTER TO 
sele agent,AGCODE from party into curs tag grou by ageNt
sele tag
IF !EMPTY(TAGENT)
	SELECT TAG
	SET FILTER TO 
	SET FILTER TO ALLTRIM(AGENT)=ALLTRIM(TAGENT)
ENDIF 
defi popu finda from 1,1 shad colo g+/n+,g+/n+,g+/n+,GR+/N+;
title padc("Agent",30) prom fiel padr(agent,35) FONT 'Consolas',15 STYLE "B" 
on sele popu finda do selag
acti popu finda REST
sele PARTY
retu



proc selag
TAgent=tag.agent
show gets
deac popu finda
RETURN


