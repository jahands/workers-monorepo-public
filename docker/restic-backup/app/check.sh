#!/bin/bash

last_log_file="/var/log/check-last.log"
last_mail_log_file="/var/log/check-mail-last.log"
last_microsoft_teams_log_file="/var/log/check-microsoft-teams-last.log"
cron_log_file="/var/log/cron.log"
export TZ=UTC

prefix() {
	awk '{ print "[restic.check]", $0 }'
}

get_date() {
	date +'%FT%H-%M-%SZ'
}

log_output() {
	if [[ "${LOG_RESTIC_OUTPUT:-}" == "false" ]]; then
		prefix >> ${last_log_file}
	else
		prefix | tee -a ${last_log_file} >> ${cron_log_file}
	fi
}

copy_error_log() {
	cp ${last_log_file} /var/log/backup-error-last.log
}

log_last() {
	echo "$1" | log_output
}

if [ -f "/hooks/pre-check.sh" ]; then
		echo "Starting pre-check script ..."
		/hooks/pre-check.sh
else
		echo "Pre-check script not found ..."
fi

start=`date +%s`
rm -f ${last_log_file} ${last_mail_log_file}
echo "Starting Check at $(get_date)"
log_last "Starting Check at $(get_date)"
log_last "CHECK_CRON: ${CHECK_CRON}"
log_last "RESTIC_DATA_SUBSET: ${RESTIC_DATA_SUBSET}"
log_last "RESTIC_REPOSITORY: ${RESTIC_REPOSITORY}"
log_last "AWS_ACCESS_KEY_ID: ${AWS_ACCESS_KEY_ID}"

# Do not save full check log to logfile but to check-last.log
if [ -n "${RESTIC_DATA_SUBSET}" ]; then
		restic check --read-data-subset=${RESTIC_DATA_SUBSET} 2>&1 | log_output
else
		restic check 2>&1 | log_output
fi
check_rc=${PIPESTATUS[0]}
log_last "Finished check at $(get_date)"
if [[ $check_rc == 0 ]]; then
		echo "Check Successful"
else
		echo "Check Failed with Status ${check_rc}"
		restic unlock 2>&1 | log_output
		copy_error_log
fi

end=`date +%s`
echo "Finished Check at $(get_date) after $((end-start)) seconds"

if [ -n "${TEAMS_WEBHOOK_URL}" ]; then
		teams_title="Restic Last Check Log"
		teams_message=$( cat ${last_log_file} | sed 's/"/\"/g' | sed "s/'/\'/g" | sed ':a;N;$!ba;s/\n/\n\n/g' )
		teams_req_body="{\"title\": \"${teams_title}\", \"text\": \"${teams_message}\" }"
		sh -c "curl -H 'Content-Type: application/json' -d '${teams_req_body}' '${TEAMS_WEBHOOK_URL}' > ${last_microsoft_teams_log_file} 2>&1"
		if [ ${PIPESTATUS[0]} == 0 ]; then
				echo "Microsoft Teams notification successfully sent."
		else
				echo "Sending Microsoft Teams notification FAILED. Check ${last_microsoft_teams_log_file} for further information."
		fi
fi

if [ -n "${MAILX_ARGS}" ]; then
		sh -c "mail -v -S sendwait ${MAILX_ARGS} < ${last_log_file} > ${last_mail_log_file} 2>&1"
		if [ ${PIPESTATUS[0]} == 0 ]; then
				echo "Mail notification successfully sent."
		else
				echo "Sending mail notification FAILED. Check ${last_mail_log_file} for further information."
		fi
fi

if [ -f "/hooks/post-check.sh" ]; then
		echo "Starting post-check script ..."
		/hooks/post-check.sh $check_rc
else
		echo "Post-check script not found ..."
fi
