
SET EXACT ON 
IF USED("SALMAS")
	SELECT SALMAS
	USE
ENDI 
IF !USED("SALMAS")
	SELECT 0
	USE SALMAS
ENDI 

Local oForm
oForm = CREATEOBJECT("TopForm1")
oForm.show()
_screen.Visible = .F. && Hide Screen

SET CONFIRM ON

sele SALMAS
set orde to code1
SET FILTER TO !EMPTY(TYPE) AND TYPE#"S"
scatter memvar
DEFINE WINDOW SALM1 from 6,19 to 18,63 NONE SHAD COLOR W+/R+,W+/N+ FONT 'Consolas',15 STYLE "B" IN WINDOW Form1 
ACTIVATE WINDOW SALM1

HIDE WINDOW SALM1
SET ORDER TO name 
defi popu find from 1,1 shad colo g+/n+,g+/n+,g+/n+,GR+/N+;
title padc("Item Name",30)+" "+padc("Code",5)+" "+PADC("RATE",10)+" "+PADC("TAX",8) prom FIELD padr(name,40)+"|"+STR(code1,5)+"|"+STR(COST,7,2)+"|"+STR(TAX,5,2) FONT 'Consolas',15 STYLE "B" 
ACTI WINDOW SALM1
ON KEY LABEL F12 DO SPRINT 
do disp
CLEA GETS
do true with "SALMAS.prg"
RELEASE WINDOW SALM1

IF USED("SALMAS")
	SELECT SALMAS
	SET FILTER TO 
	USE
ENDI 

RETU

READ EVENTS

_screen.Visible = .T. && Show Screen

DEFINE CLASS TopForm1 as Form

ShowWindow = 2
Windowstate=2
Name = "Form1"
Caption =  "Item Master"
FontName = 'Consolas'
FontSize = 17
icon = "star.ico"
BACKCOLOR=RGB(250,150,150)
PROCEDURE Destroy

CLEAR EVENTS

ENDPROC

ENDDEFINE



proc disp
@ 0,0 SAY PADC("ITEM MASTER",44) COLO W+/N+
@ 2,1 SAY "Code :" GET m.code1 WHEN .F.
@ 4,1 SAY "Name :" GET m.name PICT "@K" vali !empt(m.name) SIZE 1,35
@ 6,1 SAY "HSN  :" GET M.HSNCODE PICT "@K" VALI !empt(m.HSNCODE)
@ 6,24 SAY "PACK :" GET M.PACK PICT "@M PC,KG" VALI CHKPP()
*@ 6,34 SAY "STK  :" GET M.STK PICT "@K"
@ 6,34 SAY "TAX :" GET M.TAX SIZE 1,5,2    VALI CHKTX() PICT "@K"
@8,1 SAY "CATEGORY :" GET M.GROOP PICT "@K" VALI CHKGRP()
@10,1 get save ;
	PICTURE "@*HT Save;Cancel" ;
	SIZE 1,8,1 ;
	DEFAULT 1
@10,22 SAY 'F12-ITEM REPORT'
retu

proc clr
scatter memvar  blank
save = 2
set order to code1
SET FILTER TO !EMPTY(TYPE) AND TYPE#"S"
go bott
m.code1=code1+1
M.CODE=ALLTRIM(STR(M.CODE1))
M.PACK="PC"
show gets
retu

proc chkc
para cc
if baar=2
	retu 1
endi
seek cc
if found()
	wait wind "Code Already Exist" nowa
	retu 0
endi
retu




proc chkgrp
if empt(m.groop)
	select groop from salmas group by groop into curs xgroop where !empt(groop)
	defi popu grp prom fiel groop from 5,11 to 19,30 colo sche 5
	on sele popu grp do selgrp
	acti popu grp
	sele salmas
endi
retu



proc selgrp
m.groop=xgroop.groop
show gets
deac popu grp
retu

PROC CHKTX
IF M.TAX#0
	M.CTAX=ROUND((M.TAX/2)/100,3)
	M.STAX=ROUND((M.TAX/2)/100,3)
ELSE
	M.CTAX=0
	M.STAX=0
ENDI
RETU 

PROCEDURE CHKPP
IF M.PACK="PC"
	M.TYPE="P"
ELSE
	M.TYPE="M"
ENDIF 
SHOW GETS
RETURN 

PROCEDURE SPRINT
REPORT FORM ITEMLIST.FRX  NOCONSOLE PREVIEW IN WINDOW FORM1
RETURN 





PROC CHKGRP
SELE GROOP FROM SALMAS GROU BY GROOP INTO CURS XDET1
DEFI POPU SALD1 FROM 1,11 TO 15,40 PROM FIEL PADR(GROOP,30);
TITL PADC("CATEGORY",30) COLO GB+/N+,W+/G+,GB+/N+,GB+/N+,GB+/N+ SHAD FONT 'Consolas',15 STYLE "B" 
ON SELE POPU SALD1 DO SELDET1
LOCATE FOR ALLTRIM(GROOP)=ALLTRIM(M.GROOP)
ACTI POPU SALD1 REST 
SELE SALMAS
RETU

PROC SELDET1
M.GROOP=XDET1.GROOP
SHOW GETS
DEAC POPU SALD1
RETU
