sele ldate
*sele comp
td=date
tpass=spac(10)
defi wind myprn from 18,20 to 28,77 FONT 'Consolas',15 STYLE "B" IN WINDOW MAIN
acti wind myprn
@ 0,0 say padc("Date ",40) colo W+/R+
@ 3,5 say "Pass Word : "
@ 3,18 get tpass colo b/b,b/b,b/b,b/b 
read
XPASS=ALLT(STR(((DAY(LDATE.DATE)*MONTH(LDATE.DATE)*YEAR(LDATE.DATE))*(MONTH(LDATE.DATE)))))
*IF allt(upper(tpass))=XPASS OR allt(upper(tpass))='RAJINI' 
	@ 3,5 say "Date      : " get td size 1,10 VALI TD>=LDATE.DATE ERROR "Date Not Reversed....! Contact Administrator"
	read
*endi

if last()#27 
	repl date with td,INVREP WITH .F.
	FLUSH
	WAIT WIND "DATE CHANGED......"+DTOC(TD) NOWA
endi
rele wind myprn
set curs on
retu


