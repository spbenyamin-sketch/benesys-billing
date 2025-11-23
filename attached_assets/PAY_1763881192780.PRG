IF USED("PAyment")
	SELECT PAYMENT
	USE
ENDI 

IF USED("PARTY")
	SELECT PARTY
	USE
ENDI 

IF !USED("PARTY")
	SELECT 0
	USE PARTY
ENDI 

IF !USED("PAYMENT")
	SELECT 0
	USE PAYMENT
ENDI 

Local oForm
oForm = CREATEOBJECT("TopForm1")
oForm.show()

_screen.Visible = .F. && Hide Screen

SET CONFIRM ON 
sele PAYMENT
set orde to

scatter memvar
DEFINE WINDOW SALM3 from 4,19 to 16,63 NONE SHAD;
COLOR w+/r+,w+/n+ FONT 'Consolas',15 STYLE "B" IN WINDOW Form1
ACTIVATE WINDOW SALM3

HIDE WINDOW SALM3 
defi popu find from 1,1 shad colo g+/n+,g+/n+,g+/n+,GR+/N+;
title padc("Supplier Name",45)+" "+padc("PCode",5)+" "+"CREDIT"+" "+"DEBIT" prom fiel padr(Pname,30)+"|"+str(Pcode,5)+"-"+padr(CITY,15)+"|"+STR(CREDIT,10,2)+"|"+STR(DEBIT,10,2)  FONT 'Consolas',15 STYLE "B" 
acti WINDOW SALM3 

TAGENT=SPAC(30)
TAGE="ALL"

do disp
CLEA GETS
do true with "PAY.prg"
RELEASE WINDOW SALM3
IF USED("PAyment")
	SELECT PAYMENT
	USE
ENDI 
IF USED("PARTY")
	SELECT PARTY
	USE
ENDI 

RETU

READ EVENTS

_screen.Visible = .T. && Show Screen

DEFINE CLASS TopForm1 as Form

ShowWindow = 2
Windowstate=2
Name = "Form1"
Caption =  "Payment Entry"
FontName = 'Consolas'
FontSize = 17
icon = "star.ico"
BACKCOLOR=RGB(250,150,150)
PROCEDURE Destroy

CLEAR EVENTS

ENDPROC

ENDDEFINE



proc disp
@ 0,0 SAY PADC("PAYMENT ENTRY",44) COLO w+/n+
*@ 2,1 SAY "AGENT :" GET TAGE PICT "@M ALL,AGN"
*@ 2,14  GET TAGENT SIZE 1,25 VALI CHKAGENT() WHEN TAGE="AGN" PICT "@K"
@ 2,1 SAY "PARTY :" GET M.PNAME VALI CHKPARTY() SIZE 1,30 PICT "@K"
@ 4,1 SAY "DATE  :" GET M.DATE 
*@ 6,22 SAY "AMOUNT  :" GET M.AMOUNT SIZE 1,10,2 PICT "@K"
@ 6,1 SAY "DETAIL:" GET M.DET SIZE 1,30 VALI CHKDET() PICT "@K"
@8,1 SAY "CREDIT:" GET M.CREDIT SIZE 1,10,2 PICT "@K"
@8,22 SAY "DEBIT:" GET M.DEBIT SIZE 1,10,2 PICT "@K"
@10,13 GET save ;
	PICTURE "@*HT Save;Cancel" ;
	SIZE 1,8,1 ;
	DEFAULT 1
retu

proc clr
scatter memvar  blank
save = 2
M.DATE=DATE()
set order to Pcode
go bott
show gets
retu







PROC CHKDET
SELE DET FROM PAYMENT GROU BY DET INTO CURS XDET
DEFI POPU SALD FROM 1,11 TO 15,40 PROM FIEL PADR(DET,30);
TITL PADC("DETAIL",30) COLO GB+/N+,W+/G+,GB+/N+,GB+/N+,GB+/N+ SHAD FONT 'Consolas',15 STYLE "B" 
ON SELE POPU SALD DO SELDET
LOCATE FOR ALLTRIM(DET)=ALLTRIM(M.DET)
ACTI POPU SALD REST 
SELE PAYMENT
RETU

PROC SELDET
M.DET=XDET.DET
SHOW GETS
DEAC POPU SALD
RETU



PROCEDURE CHKPARTY
SELE PARTY
SET ORDER TO PNAME
SET FILTER TO 
SET CONFIRM ON 
IF TAGE#"ALL"
	SET FILTER TO 
	M.PNAME=""
	SHOW GETS 
	SET FILT TO ALLT(AGENT)=ALLT(TAGENT)
ENDIF 
IF !EMPTY(M.PNAME)
	SELECT PARTY
	SET FILTER TO 
	SET FILTER TO ALLTRIM(PNAME)=ALLTRIM(M.PNAME)
ENDIF 
defi popu findx from 1,1 FONT 'Consolas',15 STYLE "B" colo g+/n+,g+/n+,g+/n+,GR+/N+;
title padc("Name",30) prom fiel padr(Pname,35)+"-"+padr(city,25)
on sele popu findx do selfindx
acti popu findx 
SELE PARTY
SET FILT TO
IF EMPT(m.PNAME)
	WAIT WIND "PLEASE SELECT PARTY NAME" NOWA
ENDI 
sele PAYMENT
retu



proc selfindx
m.pname=party.pname
m.add1=party.add1
m.CITY=party.CITY
m.tin=party.tin
M.AGENT=PARTY.AGENT
M.PCODE=PARTY.PCODE
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
sele PAYMENT
retu



proc selag
TAGENT=tag.agent
show gets
deac popu finda
RETURN
