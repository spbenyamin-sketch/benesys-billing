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

IF USED("PAYMENT")
	SELECT PAYMENT
	USE
ENDI 

IF USED("PURCHASE")
	SELECT PURCHASE
	USE
ENDI 

IF !USED("PARTY")
	SELECT 0
	USE PARTY
ENDI 


IF !USED("MAINSALE")
	SELECT 0
	USE DATA\MAINSALE
ENDI 

IF !USED("SALE")
	SELECT 0
	USE DATA\SALE
ENDI 

IF !USED("PAYMENT")
	SELECT 0
	USE PAYMENT
ENDI 

IF !USED("PURCHASE")
	SELECT 0
	USE PURCHASE
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
TOPEN=0
PCREDIT=0
PDEBIT=0
SELE MAINSALE
SET ORDER TO DATE
GO TOP
FDT=MFDATE
TDT=DATE()
ITDET="NO "
TPCODE=0
TPNAME=SPAC(30)
TCITY=SPAC(20)
TAGE="ALL"
TAGENT=SPAC(25)

defi wind myprn from 7,20 to 14,55 shad colo w+/r+,w+/n+ NONE FONT 'Consolas',15 STYLE "B" IN WINDOW Form1
acti wind myprn
@ 0,0 say padc("PARTY LEDGER",39) colo W+/N+
@ 2,1 SAY "FROM :" GET FDT 
@ 2,21 SAY "TO :" GET TDT 
*@ 4,1 SAY "AGENT :" GET TAGE PICT "@M ALL,AGN"
*@ 4,14  GET TAGENT SIZE 1,25 VALI CHKAGENT() WHEN TAGE="AGN" pict "@K"
@ 4,1 SAY "PARTY :" GET TPNAME  VALI CHKPARTY() pict "@K"
*@ 8,1 GET ITDET PICT "@MK NO,YES" 
@ 6,8 GET prn PICTURE "@*hT \<Screen;\<Printer;\<Exit" 
read
if last()=27 or prn=3
	rele wind myprn
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

IF USED("PAYMENT")
	SELECT PAYMENT
	USE
ENDI 

IF USED("PURCHASE")
	SELECT PURCHASE
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
		defi wind crea from 8,25 to 13,55 doub shad colo sche 10  FONT 'Consolas',15 STYLE "B"
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

DO HED
TOT=0
SET SAFE OFF
SELECT "INV" AS BTYPE,FDT AS FDATE,TDT AS TDATE,SPAC(50) AS DET,ROF,AGENT,CUSTCODE AS PCODE,CUSTNAME AS PNAME,CUSTCITY AS CITY,DATE,INVNO,SALEVALUE,TAXVALUE,GTOT AS NETAMT,0000000.00 AS PAYAMT FROM MAINSALE WHERE CUSTCODE=TPCODE ORDER BY INVNO INTO TABLE TEMP\PTLED
SELE PTLED
REPL ALL DET WITH "SALES INV.NO."+ALLT(STR(INVNO)) FOR !EMPT(INVNO) 

IF 1=2
IF ITDET="YES"
	REPL ALL DET WITH "SALES INV.NO."+ALLT(STR(INVNO)) FOR !EMPT(INVNO) AND TAXVALUE=0
	REPL ALL DET WITH "AMT: "+STR(SALEVALUE+ROF,8,2)+" TAX :"+STR(TAXVALUE,8,2)+" = INV.NO."+ALLT(STR(INVNO)) FOR !EMPT(INVNO) AND TAXVALUE#0
ELSE
	REPL ALL DET WITH "SALES INV.NO."+ALLT(STR(INVNO)) FOR !EMPT(INVNO) 
ENDIF
ENDIF 

SELE PURCHASE
SCAN  FOR PCODE=TPCODE
	SCAT MEMV
	SELE PTLED
	APPE BLANK
	GATH MEMV
	REPL BTYPE WITH "PUR"
	REPLACE DET WITH "PURCHASE BILL.NO."+ALLT(STR(PURCHASE.INVNO))
	REPL FDATE WITH FDT
	REPL TDATE WITH TDT
	REPL PAYAMT WITH PURCHASE.AMOUNT
ENDS

SELE PAYMENT
SCAN  FOR PCODE=TPCODE
	SCAT MEMV
	SELE PTLED
	APPE BLANK
	GATH MEMV
	REPL BTYPE WITH "PAY"
	REPL FDATE WITH FDT
	REPL TDATE WITH TDT
	REPL PAYAMT WITH PAYMENT.CREDIT
	REPL NETAMT WITH PAYMENT.DEBIT
	
ENDS

IF ITDET="YES"
SELE SALE
SCAN FOR CUSTCODE=TPCODE
	SELE PTLED
	APPE BLANK
	REPL FDATE WITH FDT
	REPL TDATE WITH TDT
	REPL BTYPE WITH "DNV"
	REPL INVNO WITH SALE.INVNO
	REPL DET WITH STR(SALE.RATE,5,2)+" * "+STR(SALE.QTY,3)+" = "+STR(SALE.QTY*SALE.RATE,7,2)+"  "+ALLT(SALE.NAME)
	REPL DATE WITH SALE.DATE
	SELE SALE
ENDS
ENDI

TBAL=""
TDB=0
TCR=0
TSP=0
SELE PTLED
SUM NETAMT,PAYAMT FOR DATE<FDT TO TXX,TYY
XX=(PDEBIT+TXX)-(TYY+PCREDIT)
IF XX>0
	TBAL="BALANCE DEBIT FORWARD  "+ALLT(STR(XX,10,2))
	TDB=XX
	TSP=32
ELSE
	IF XX<0
		TBAL="BALANCE CREDIT FORWARD  "+ALLT(STR(ABS(XX),10,2))
		TCR=XX
		TSP=40
	ELSE
		TBAL=""
	ENDI
ENDI
SELE * FROM PTLED ORDE BY DATE,INVNO,BTYPE INTO CURS PT WHER DATE>=FDT AND DATE<=TDT
SELE PT

IF !EMPT(TBAL)
	?SPAC(TSP)+TBAL
	?
ENDI
go top
scan 
	?PADR(DTOC(DATE),12)+" "+PADR(DET,40)+" "+IIF(NETAMT#0,STR(NETAMT,10,2),SPAC(12))+' '+IIF(PAYAMT#0,str(PAYAMT,10,2),SPAC(12))
	tDB=tDB+NETAMT
	tCR=tCR+PAYAMT
ends
?repl("-",78)
?spac(52)+str(tDB,12,2)+SPAC(1)+str(tCR,12,2)
?repl("=",78)
XX1=TDB-TCR
TSP1=0
TBAL1=""
IF XX1>0
	TBAL1="BALANCE DEBIT  "+ALLT(STR(XX1,10,2))
	TSP1=37
ELSE
	IF XX1<0
		TBAL1="BALANCE CREDIT  "+ALLT(STR(ABS(XX1),10,2))
		TSP1=50
	ELSE
		TBAL1="BALANCE NIL"
		TSP1=50
	ENDI
ENDI
IF !EMPT(TBAL1)
	?SPAC(TSP1)+TBAL1
ENDI

SELE *,TBAL AS TBAL,TBAL1 AS TBAL1 FROM PT INTO TABL TEMP\PLED
SELE PLED
USE

SELE PTLED
USE


rele wind crea
set curs on
set cons on
if prn  = 1
	set alte off
	set alte to
	modi file out.txt  IN wind Form1 noed
else
	set print off
endi
set cons off
set prin off
set cons on
IF PRN=2
   	*!VB6\VFP98\VFP6.EXE VFPPRG11
   	REPORT FORM LEDGER.frx  NOCONSOLE PREVIEW IN WINDOW Form1
ENDI
RELEASE WINDOW myprn
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

IF USED("PAYMENT")
	SELECT PAYMENT
	USE
ENDI 

IF USED("PURCHASE")
	SELECT PURCHASE
	USE
ENDI 

RETURN

READ EVENTS

_screen.Visible = .T. && Show Screen

DEFINE CLASS TopForm1 as Form

ShowWindow = 2
Windowstate=2
Name = "Form1"
Caption =  "Party Ledger Report"
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
?PADC("PARTY LEDGER REPORT",78)
?"FROM :"+DTOC(FDT)+" TO :"+DTOC(TDT)
?ALLT(TPNAME)+"-"+ALLT(TCITY)
?repl("-",78)
?PADC("DATE",12)+"  "+PADC("DETAILS",40)+"  "+PADC("DEBIT",10)+"  "+PADC("CREDIT",10)
?repl("-",78)
retu


proc pgbrk
sl=0
?repl("-",78)
if prn=2
	eject
endi
do hed
retu



PROCEDURE CHKPARTY
SELE PARTY
SET ORDER TO PNAME
SET FILTER TO 
SET CONFIRM ON 
IF TAGE#"ALL"
	SET FILTER TO 
	TPNAME=""
	SHOW GETS 
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
retu



proc selfindx
Tpname=party.pname
TCITY=party.CITY
TPCODE=PARTY.PCODE
*TOPEN=PARTY.OPENING
PCREDIT=PARTY.OPCREDIT
PDEBIT=PARTY.OPDEBIT 
show gets
deac popu findx
retu



PROCEDURE CHKAGENT
SELECT PARTY 
SET FILTER TO 
sele agent from party into curs tag grou by ageNt
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
retu



proc selag
Tagent=tag.agent
show gets
deac popu finda
RETURN
